document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const gradesBody = document.getElementById('grades-body');
    const addRowBtn = document.getElementById('add-row');
    const calculateBtn = document.getElementById('calculate');
    const resetBtn = document.getElementById('reset');
    const autoCalculate = document.getElementById('auto-calculate');
    const totalScoreCell = document.getElementById('total-score');
    const finalAverageCell = document.getElementById('final-average');
    const resultsCard = document.getElementById('results-card');
    const detailedResults = document.getElementById('detailed-results');
    const savedStructuresSelect = document.getElementById('saved-structures');
    const loadStructureBtn = document.getElementById('load-structure');
    const deleteStructureBtn = document.getElementById('delete-structure');
    const saveStructureBtn = document.getElementById('save-structure');
    const structureNameInput = document.getElementById('structure-name');

    // Datos iniciales
    const initialData = [
        { evaluation: 'Practica 1', nota: '', peso: '20%' },
        { evaluation: 'Practica 2', nota: '', peso: '20%' },
        { evaluation: 'Trabajo Encargado 1', nota: '', peso: '15%' },
        { evaluation: 'Exámen Parcial 1', nota: '', peso: '15%' },
        { evaluation: 'Exámen Parcial 2', nota: '', peso: '15%' },
        { evaluation: 'Medio Curso', nota: '', peso: '25%' },
        { evaluation: 'Evaluación Actitudinal 1', nota: '', peso: '5%' },
        { evaluation: 'Exámen Final', nota: '', peso: '20%' }
    ];

    // Inicializar la tabla con datos por defecto
    function initializeTable() {
        gradesBody.innerHTML = '';
        initialData.forEach(item => addGradeRow(item.evaluation, item.nota, item.peso));
        totalScoreCell.textContent = '0';
        finalAverageCell.textContent = '0';
        resultsCard.style.display = 'none';
        structureNameInput.value = '';
    }

    // Agregar una nueva fila a la tabla
    function addGradeRow(evaluation = '', nota = '', peso = '') {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="text" class="form-control evaluation-input" value="${evaluation}" 
                       placeholder="Nombre evaluación" required>
            </td>
            <td>
                <input type="number" class="form-control grade-input" value="${nota}" 
                       min="0" max="20" step="0.1" placeholder="0-20">
            </td>
            <td>
                <div class="input-group">
                    <input type="text" class="form-control weight-input" value="${peso}" 
                           placeholder="10%" required>
                    <span class="input-group-text">%</span>
                </div>
            </td>
            <td class="score-cell">0</td>
            <td class="actions-cell">
                <button class="btn btn-sm btn-outline-danger remove-row" title="Eliminar">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        gradesBody.appendChild(row);

        // Event listeners para la nueva fila
        const gradeInput = row.querySelector('.grade-input');
        const weightInput = row.querySelector('.weight-input');
        const evalInput = row.querySelector('.evaluation-input');

        gradeInput.addEventListener('input', handleInputChange);
        weightInput.addEventListener('input', handleInputChange);
        evalInput.addEventListener('input', handleInputChange);

        row.querySelector('.remove-row').addEventListener('click', function() {
            if (gradesBody.querySelectorAll('tr').length > 1) {
                row.remove();
                if (autoCalculate.checked) calculateGrades();
            } else {
                alert('Debe haber al menos una evaluación');
            }
        });

        updateRowStyle(row, nota);
    }

    // Manejador de cambios en los inputs
    function handleInputChange(e) {
        const row = e.target.closest('tr');
        if (!row) return;

        if (e.target.classList.contains('grade-input')) {
            updateRowStyle(row, e.target.value);
        }

        if (autoCalculate.checked) {
            calculateGrades();
        }
    }

    // Calcular las notas
    function calculateGrades() {
        const rows = gradesBody.querySelectorAll('tr');
        const data = { items: [] };
        let totalWeight = 0;

        rows.forEach(row => {
            const evaluation = row.querySelector('.evaluation-input').value;
            const nota = row.querySelector('.grade-input').value;
            const peso = row.querySelector('.weight-input').value;

            if (evaluation && peso) {
                data.items.push({ evaluation, nota, peso });

                // Calcular peso total
                try {
                    const weightValue = parseFloat(peso.replace('%', ''));
                    if (!isNaN(weightValue)) totalWeight += weightValue;
                } catch (e) {
                    console.error('Error parsing weight:', e);
                }
            }
        });

        // Validar peso total
        if (Math.abs(totalWeight - 100) > 0.1) {
            alert(`La suma de los pesos es ${totalWeight}%. Debe ser exactamente 100%`);
            return;
        }

        document.getElementById('total-weight').textContent = `${totalWeight}%`;

        fetch('/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(data => {
                updateTableResults(data.results);
                updateFinalResults(data.total_score);
                showDetailedResults(data.results, data.total_score);
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al calcular los promedios');
            });
    }

    // Actualizar los resultados en la tabla
    function updateTableResults(results) {
        const rows = gradesBody.querySelectorAll('tr');
        results.forEach((result, index) => {
            if (rows[index]) {
                rows[index].querySelector('.score-cell').textContent = result.puntaje;
                updateRowStyle(rows[index], result.nota);
            }
        });
    }

    // Actualizar resultados finales
    function updateFinalResults(totalScore) {
        totalScoreCell.textContent = totalScore;
        finalAverageCell.textContent = totalScore;
    }

    // Mostrar resultados detallados
    function showDetailedResults(results, totalScore) {
        resultsCard.style.display = 'block';

        let html = `
            <div class="table-responsive">
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Evaluación</th>
                            <th>Nota</th>
                            <th>Peso</th>
                            <th>Puntaje</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        results.forEach(result => {
            html += `
                <tr>
                    <td>${result.evaluation}</td>
                    <td>${result.nota}</td>
                    <td>${result.peso}</td>
                    <td>${result.puntaje}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
            <div class="alert alert-success mt-3">
                <h5 class="alert-heading">Promedio Final: ${totalScore}</h5>
                <div class="progress mt-2">
                    <div class="progress-bar" role="progressbar" style="width: ${totalScore * 5}%" 
                        aria-valuenow="${totalScore}" aria-valuemin="0" aria-valuemax="20">
                        ${totalScore}
                    </div>
                </div>
                <p class="mb-0 mt-2">${getPerformanceMessage(totalScore)}</p>
            </div>
        `;

        detailedResults.innerHTML = html;
        updateProgressBarColor(totalScore);
    }

    // Reiniciar la calculadora
    function resetCalculator() {
        if (confirm('¿Está seguro que desea reiniciar la calculadora? Todos los datos se perderán.')) {
            initializeTable();
        }
    }

    // Cargar estructuras guardadas
    function loadSavedStructures() {
        fetch('/get-structures')
            .then(response => response.json())
            .then(data => {
                savedStructuresSelect.innerHTML = '<option value="">Seleccionar estructura guardada...</option>';
                data.saved_structures.forEach(structure => {
                    const option = document.createElement('option');
                    option.value = structure;
                    option.textContent = structure;
                    savedStructuresSelect.appendChild(option);
                });
            })
            .catch(error => console.error('Error:', error));
    }

    // Cargar estructura seleccionada
    function loadSelectedStructure() {
        const structureName = savedStructuresSelect.value;
        if (!structureName) return;

        fetch(`/load-structure/${structureName}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                    return;
                }

                gradesBody.innerHTML = '';
                data.structure.forEach(item => addGradeRow(item.evaluation, '', item.peso));
                structureNameInput.value = data.name || structureName;

                showAlert(`Estructura "${structureName}" cargada`, 'success');
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('Error al cargar la estructura', 'danger');
            });
    }

    // Guardar estructura actual
    function saveCurrentStructure() {
        const structureName = structureNameInput.value.trim();
        if (!structureName) {
            showAlert('Por favor ingresa un nombre para la estructura', 'warning');
            return;
        }

        const rows = gradesBody.querySelectorAll('tr');
        const structure = [];

        rows.forEach(row => {
            const evaluation = row.querySelector('.evaluation-input').value;
            const peso = row.querySelector('.weight-input').value;

            if (evaluation && peso) {
                structure.push({ evaluation, peso });
            }
        });

        if (structure.length === 0) {
            showAlert('No hay evaluaciones para guardar', 'warning');
            return;
        }

        fetch('/save-structure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: structureName, items: structure })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    showAlert(data.error, 'danger');
                    return;
                }

                showAlert(`Estructura "${structureName}" guardada correctamente`, 'success');
                loadSavedStructures();
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('Error al guardar la estructura', 'danger');
            });
    }

    // Eliminar estructura seleccionada
    function deleteSelectedStructure() {
        const structureName = savedStructuresSelect.value;
        if (!structureName) return;

        if (!confirm(`¿Está seguro que desea eliminar la estructura "${structureName}"?`)) {
            return;
        }

        fetch('/save-structure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: structureName, items: [] })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    showAlert(data.error, 'danger');
                    return;
                }

                showAlert(`Estructura "${structureName}" eliminada`, 'success');
                savedStructuresSelect.value = '';
                structureNameInput.value = '';
                loadSavedStructures();
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('Error al eliminar la estructura', 'danger');
            });
    }

    // Mostrar alerta
    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        const container = document.querySelector('.container');
        container.prepend(alertDiv);

        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 150);
        }, 5000);
    }

    // Actualizar estilo de fila según la nota
    function updateRowStyle(row, grade) {
        const numGrade = parseFloat(grade) || 0;
        row.classList.remove('low-grade', 'medium-grade', 'high-grade');

        if (numGrade > 0) {
            if (numGrade < 10.5) {
                row.classList.add('low-grade');
            } else if (numGrade < 14) {
                row.classList.add('medium-grade');
            } else {
                row.classList.add('high-grade');
            }
        }
    }

    // Actualizar color de la barra de progreso
    function updateProgressBarColor(score) {
        const progressBar = document.querySelector('.progress-bar');
        if (!progressBar) return;

        const numScore = parseFloat(score) || 0;
        progressBar.classList.remove('bg-danger', 'bg-warning', 'bg-success');

        if (numScore < 10.5) {
            progressBar.classList.add('bg-danger');
        } else if (numScore < 14) {
            progressBar.classList.add('bg-warning');
        } else {
            progressBar.classList.add('bg-success');
        }
    }

    // Obtener mensaje de rendimiento
    function getPerformanceMessage(score) {
        const numScore = parseFloat(score) || 0;

        if (numScore >= 18) return "¡Excelente trabajo! Mantén ese rendimiento.";
        if (numScore >= 15) return "Buen trabajo, pero aún puedes mejorar.";
        if (numScore >= 11) return "Rendimiento aceptable, considera estudiar más.";
        if (numScore > 0) return "Necesitas mejorar significativamente. Busca ayuda académica.";
        return "Ingresa tus notas para calcular tu promedio.";
    }

    // Event listeners
    addRowBtn.addEventListener('click', () => addGradeRow());
    calculateBtn.addEventListener('click', calculateGrades);
    resetBtn.addEventListener('click', resetCalculator);
    autoCalculate.addEventListener('change', function() {
        if (this.checked) calculateGrades();
    });
    loadStructureBtn.addEventListener('click', loadSelectedStructure);
    saveStructureBtn.addEventListener('click', saveCurrentStructure);
    deleteStructureBtn.addEventListener('click', deleteSelectedStructure);

    // Inicializar
    initializeTable();
    loadSavedStructures();
});