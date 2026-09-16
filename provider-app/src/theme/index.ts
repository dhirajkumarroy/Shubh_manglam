export * from './colors';
export * from './spacing';
export * from './typography';
export * from './radius';

import colors from './colors';
import spacing from './spacing';
import typography from './typography';
import radius from './radius';

export { colors, spacing, typography, radius };

const theme = {
  colors,
  spacing,
  typography,
  radius,
};

export default theme;
