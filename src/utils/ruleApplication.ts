// Matrix Puzzle System - Rule Application and Evaluation
// Kuralları uygulayan ve dönüşümleri yönlendiren fonksiyonlar

import {
    BaseShape,
    Transformation,
    MatrixRule,
} from '../types/matrixRules.ts';

import {
    applyRotation,
    applyMirror,
    applyScale,
    applyColorCycle,
    applyColorSwap,
    applyGridRowShift,
    applyGridColShift,
    applyGridCellToggle,
    applyGridRotate,
    applyGridCellInvert,
    applyGridShiftAlternating,
    applyGridEdgeDelete,
    applyGridDiagonalShift,
    applyGridXOR,
    applyBarsShift,
} from './ruleTransformations.ts';

// ============================================
// ANA DÖNÜŞÜM UYGULAYICI
// ============================================

/**
 * Tek bir dönüşümü uygular
 */
export function applySingleTransformation(
    shape: BaseShape,
    transformation: Transformation,
    step: number = 1
): BaseShape {
    switch (transformation.type) {
        case 'rotate':
            return applyRotation(shape, transformation.degrees * step);

        case 'mirror':
            // Mirror her adımda toggle olur
            return step % 2 === 1 ? applyMirror(shape, transformation.axis) : shape;

        case 'scale':
            return applyScale(shape, Math.pow(transformation.factor, step));

        case 'colorCycle':
            return applyColorCycle(shape, step, transformation.colors);

        case 'colorSwap':
            return step % 2 === 1 ? applyColorSwap(shape) : shape;

        case 'strokeIncrease': {
            // İlk sütunda 1px, sonra her sütunda step kadar artar
            const baseStrokeWidth = 1;
            return {
                ...shape,
                strokeWidth: Math.min(baseStrokeWidth + transformation.step * step, 8),
                strokeColor: shape.strokeColor || '#333333',
            };
        }

        case 'gridRowShift': {
            let rowResult = shape;
            for (let i = 0; i < step; i++) {
                rowResult = applyGridRowShift(rowResult, transformation.direction);
            }
            return rowResult;
        }

        case 'gridColShift': {
            let colResult = shape;
            for (let i = 0; i < step; i++) {
                colResult = applyGridColShift(colResult, transformation.direction);
            }
            return colResult;
        }

        case 'gridCellToggle':
            return step % 2 === 1
                ? applyGridCellToggle(shape, transformation.positions)
                : shape;

        case 'gridRotate':
            return applyGridRotate(shape, transformation.degrees * step);

        case 'gridCellInvert':
            return applyGridCellInvert(shape, step);

        case 'gridShiftAlternating':
            return applyGridShiftAlternating(shape, step);

        case 'gridEdgeDelete':
            return applyGridEdgeDelete(shape, step);

        case 'gridDiagonalShift':
            return applyGridDiagonalShift(shape, step);

        case 'gridXOR':
            return applyGridXOR(shape, step);

        case 'barsShift':
            return applyBarsShift(shape, step);

        case 'barsShiftVertical':
            return applyBarsShift(shape, step); // Aynı mantık, sadece ShapeRenderer'da yön farklı

        default:
            return shape;
    }
}

/**
 * Bir kuraldaki tüm dönüşümleri sırayla uygular
 */
export function applyRule(
    shape: BaseShape,
    rule: MatrixRule,
    step: number
): BaseShape {
    let result = shape;

    for (const transformation of rule.transformations) {
        result = applySingleTransformation(result, transformation, step);
    }

    return result;
}
