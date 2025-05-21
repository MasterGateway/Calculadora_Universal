from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Base de datos simple en memoria para estructuras guardadas
saved_structures = {
    'default': [
        {'evaluation': 'Practica 1', 'peso': '20%'},
        {'evaluation': 'Practica 2', 'peso': '20%'},
        {'evaluation': 'Trabajo Encargado 1', 'peso': '15%'},
        {'evaluation': 'Exámen Parcial 1', 'peso': '15%'},
        {'evaluation': 'Exámen Parcial 2', 'peso': '15%'},
        {'evaluation': 'Medio Curso', 'peso': '25%'},
        {'evaluation': 'Evaluación Actitudinal 1', 'peso': '5%'},
        {'evaluation': 'Exámen Final', 'peso': '20%'}
    ]
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.get_json()
    
    total_score = 0
    results = []
    
    for item in data['items']:
        try:
            note = float(item['nota']) if item['nota'] else 0
            weight = float(item['peso'].strip('%')) / 100
            score = note * weight
            total_score += score
            
            results.append({
                'evaluation': item['evaluation'],
                'nota': note,
                'peso': item['peso'],
                'puntaje': round(score, 2)
            })
        except ValueError:
            continue
    
    return jsonify({
        'results': results,
        'total_score': round(total_score, 2),
        'promedio_final': round(total_score, 2)
    })

@app.route('/save-structure', methods=['POST'])
def save_structure():
    data = request.get_json()
    structure_name = data.get('name')
    items = data.get('items')
    
    if not structure_name or not items:
        return jsonify({'error': 'Nombre y estructura son requeridos'}), 400
    
    # Si enviamos items vacíos, eliminamos la estructura
    if len(items) == 0:
        if structure_name in saved_structures:
            del saved_structures[structure_name]
            return jsonify({'success': True, 'action': 'deleted', 'saved_structures': list(saved_structures.keys())})
        else:
            return jsonify({'error': 'Estructura no encontrada'}), 404
    
    saved_structures[structure_name] = items
    return jsonify({'success': True, 'action': 'saved', 'saved_structures': list(saved_structures.keys())})

@app.route('/get-structures', methods=['GET'])
def get_structures():
    return jsonify({'saved_structures': list(saved_structures.keys())})

@app.route('/load-structure/<name>', methods=['GET'])
def load_structure(name):
    structure = saved_structures.get(name)
    if not structure:
        return jsonify({'error': 'Estructura no encontrada'}), 404
    return jsonify({'structure': structure, 'name': name})

if __name__ == '__main__':
    app.run(debug=True)