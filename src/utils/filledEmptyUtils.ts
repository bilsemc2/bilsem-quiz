export interface Shape {
    type: string;
    filled: boolean;
    svg: string;
}

export const shapeDefinitions = {
   
        circle: { type: 'circle', generator: () => `<circle cx="50" cy="50" r="40" />` },
        square: { type: 'rect', generator: () => `<rect x="10" y="10" width="80" height="80" />` },
        triangle: { type: 'polygon', generator: () => `<polygon points="50,10 90,90 10,90" />` },
        star: { type: 'polygon', generator: () => `<polygon points="50,10 61,40 94,40 68,60 79,90 50,70 21,90 32,60 6,40 39,40" />` },
        hexagon: { type: 'polygon', generator: () => `<polygon points="50,10 90,30 90,70 50,90 10,70 10,30" />` },
        diamond: { type: 'polygon', generator: () => `<polygon points="50,10 90,50 50,90 10,50" />` },
        oval: { type: 'ellipse', generator: () => `<ellipse cx="50" cy="50" rx="40" ry="30" />` },
        pentagon: { type: 'polygon', generator: () => `<polygon points="50,10 90,40 75,90 25,90 10,40" />` },
        arrow: { type: 'polygon', generator: () => `<polygon points="50,10 90,50 70,50 70,90 30,90 30,50 10,50" />` },
        heart: { type: 'path', generator: () => `<path d="M50,90 L20,60 C10,50 10,30 20,20 C30,10 50,20 50,40 C50,20 70,10 80,20 C90,30 90,50 80,60 Z" />` },
        cloud: { type: 'path', generator: () => `<path d="M20,60 C10,60 10,40 20,30 C30,20 50,20 60,30 C70,20 90,20 90,40 C100,50 90,60 80,60 Z" />` },
        cross: { type: 'polygon', generator: () => `<polygon points="40,10 60,10 60,40 90,40 90,60 60,60 60,90 40,90 40,60 10,60 10,40 40,40" />` },
        pawn: { type: 'path', generator: () => `<path d="M50,90 C60,80 70,70 70,50 C70,30 50,10 30,10 C10,10 10,30 10,50 C10,70 20,80 30,90 Z" />` },
    rook: { type: 'path', generator: () => `<path d="M10,90 L10,50 L30,50 L30,30 L20,30 L20,10 L80,10 L80,30 L70,30 L70,50 L90,50 L90,90 Z" />` },
    knight: { type: 'path', generator: () => `<path d="M50,90 L30,70 L20,50 L10,30 L20,10 L40,20 L60,10 L80,20 L90,30 L80,50 L70,70 Z" />` },
    bishop: { type: 'path', generator: () => `<path d="M50,90 L30,70 L20,50 L30,30 L40,10 L60,10 L70,30 L80,50 L70,70 Z" />` },
    queen: { type: 'path', generator: () => `<path d="M50,90 L30,70 L20,50 L30,30 L40,10 L50,30 L60,10 L70,30 L80,50 L70,70 Z M50,50 L40,40 L50,30 L60,40 Z" />` },
    king: { type: 'path', generator: () => `<path d="M50,90 L30,70 L20,50 L30,30 L40,10 L50,30 L60,10 L70,30 L80,50 L70,70 Z M50,50 L40,40 L50,30 L60,40 Z M50,70 L40,60 L50,50 L60,60 Z"/>` }
    
};

export const generateShapes = (): Shape[] => {
    return Object.entries(shapeDefinitions).flatMap(([name, definition]) => {
        const filledSvg = `<g class="shape filled">${definition.generator()}</g>`;
        const outlineSvg = `<g class="shape outline">${definition.generator()}</g>`;
        
        return [
            { type: name, filled: true, svg: filledSvg },
            { type: name, filled: false, svg: outlineSvg }
        ];
    });
};

export const generateRowBasedPuzzle = (shapes: Shape[]): Shape[] => {
    const shuffledShapes = [...shapes].sort(() => Math.random() - 0.5);
    const isFilled = Math.random() < 0.5;
    let firstRowShapes: Shape[] = [];

    do {
        const shape = shuffledShapes.find(s => 
            s.filled === isFilled && 
            !firstRowShapes.some(fs => fs.type === s.type)
        );
        if (shape) firstRowShapes.push(shape);
    } while (firstRowShapes.length < 2);

    const secondRowShapes = firstRowShapes.map(shape => 
        shapes.find(s => s.type === shape.type && s.filled !== shape.filled)
    ).filter((s): s is Shape => s !== undefined);

    return [...firstRowShapes, ...secondRowShapes];
};

export const generateColumnBasedPuzzle = (shapes: Shape[]): Shape[] => {
    const shuffledShapes = [...shapes].sort(() => Math.random() - 0.5);
    const firstColumnFilled = Math.random() < 0.5;
    const secondColumnFilled = Math.random() < 0.5;

    const firstShape = shuffledShapes.find(s => s.filled === firstColumnFilled);
    const secondShape = shuffledShapes.find(s => 
        s.filled === secondColumnFilled && 
        s.type !== firstShape?.type
    );

    if (!firstShape || !secondShape) return [];

    const thirdShape = shapes.find(s => s.type === firstShape.type && s.filled === firstColumnFilled);
    const fourthShape = shapes.find(s => s.type === secondShape.type && s.filled === secondColumnFilled);

    if (!thirdShape || !fourthShape) return [];

    return [firstShape, secondShape, thirdShape, fourthShape];
};

export const getRandomShapes = (shapes: Shape[], excludeShape: Shape, count: number): Shape[] => {
    const remainingShapes = shapes.filter(shape => 
        !(shape.type === excludeShape.type && shape.filled === excludeShape.filled)
    );
    const randomShapes: Shape[] = [];

    while (randomShapes.length < count && remainingShapes.length > 0) {
        const randomIndex = Math.floor(Math.random() * remainingShapes.length);
        randomShapes.push(remainingShapes.splice(randomIndex, 1)[0]);
    }

    return randomShapes;
};
