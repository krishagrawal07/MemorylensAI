import { createIconSet } from 'react-native-vector-icons';

const materialGlyphMap = require('react-native-vector-icons/glyphmaps/MaterialIcons.json');

// RN 0.84 + Android can fail to resolve the "Material Icons" family name from RNVI v10.
// Using the asset font family key ("MaterialIcons") avoids tofu rectangle glyphs.
const AppIcon = createIconSet(materialGlyphMap, 'MaterialIcons', 'MaterialIcons.ttf');

export default AppIcon;
