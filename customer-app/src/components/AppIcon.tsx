import React from 'react';
import { Ionicons, Feather, MaterialCommunityIcons, FontAwesome6 } from '@expo/vector-icons';

export interface AppIconProps {
  type?: 'ionicons' | 'feather' | 'material' | 'fa6';
  name: any;
  size?: number;
  color?: string;
  style?: any;
}

export const AppIcon: React.FC<AppIconProps> = ({
  type = 'ionicons',
  name,
  size = 20,
  color = '#1C1917',
  style,
}) => {
  if (type === 'feather') {
    return <Feather name={name} size={size} color={color} style={style} />;
  }
  if (type === 'material') {
    return <MaterialCommunityIcons name={name} size={size} color={color} style={style} />;
  }
  if (type === 'fa6') {
    return <FontAwesome6 name={name} size={size} color={color} style={style} />;
  }
  return <Ionicons name={name} size={size} color={color} style={style} />;
};

export default AppIcon;
