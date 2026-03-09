import { protectElement } from './guards/protectElement';
import type { GuardChildrenProps, GuardOptions } from './guards/guardTypes';

type RequireAuthProps = GuardChildrenProps & GuardOptions;

export default function RequireAuth({ children, ...options }: RequireAuthProps) {
    return protectElement(children, options);
}
