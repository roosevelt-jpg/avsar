import { Circle, Path, Svg, View } from '@react-pdf/renderer';

/**
 * The brand mark, faint and centred, on every page of a document we prepare.
 *
 * It is the same mark as the site logo: a terracotta disc, an arc, and a
 * ring. Light enough that the candidate's own words stay readable, and
 * present so a printed copy still shows who prepared it.
 */
export function LogoWatermark() {
  return (
    <View
      fixed
      style={{
        position: 'absolute',
        top: 310,
        left: 175,
        opacity: 0.09,
      }}
    >
      <Svg width={240} height={137} viewBox="0 0 112 64">
        <Path d="M20 44 C 34 4, 78 4, 92 44" stroke="#1B1A17" strokeWidth={3} fill="none" />
        <Circle cx={20} cy={44} r={16} fill="#B9583A" />
        <Circle cx={92} cy={44} r={15} stroke="#1B1A17" strokeWidth={4} fill="none" />
        <Circle cx={92} cy={44} r={6} fill="#1B1A17" />
      </Svg>
    </View>
  );
}
