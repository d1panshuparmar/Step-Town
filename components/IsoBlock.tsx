import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { fonts } from '@/constants/theme';
import { GRID_SIZE } from '@/constants/catalog';

const TILE_W = 96;
const TILE_H = 54;

/** Lush continuous meadow — Township vibe, original art, no board-game tiles. */
export function TownMeadow({
  cols = GRID_SIZE,
  rows = GRID_SIZE,
}: {
  cols?: number;
  rows?: number;
}) {
  const w = cols * TILE_W + TILE_W * 1.4;
  const h = rows * TILE_H + TILE_H * 4;
  const cx = w / 2;
  const cy = h * 0.38;

  const lawn = `
    M ${cx},${cy - rows * (TILE_H / 2) - 48}
    L ${cx + cols * (TILE_W / 2) + 70},${cy + 14}
    L ${cx},${cy + rows * (TILE_H / 2) + 70}
    L ${cx - cols * (TILE_W / 2) - 70},${cy + 14}
    Z
  `;

  return (
    <View style={[styles.meadow, { width: w, height: h }]} pointerEvents="none">
      <Svg width={w} height={h}>
        <Defs>
          <RadialGradient id="lawnGlow" cx="50%" cy="40%" r="75%">
            <Stop offset="0%" stopColor="#C4F878" />
            <Stop offset="28%" stopColor="#98E850" />
            <Stop offset="58%" stopColor="#68D038" />
            <Stop offset="85%" stopColor="#48B828" />
            <Stop offset="100%" stopColor="#349820" />
          </RadialGradient>
          <LinearGradient id="hillFar" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#8EE060" />
            <Stop offset="100%" stopColor="#4EAE28" />
          </LinearGradient>
          <LinearGradient id="hillNear" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#6AD048" />
            <Stop offset="100%" stopColor="#3F9A28" />
          </LinearGradient>
          <LinearGradient id="asphalt" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#8A8E94" />
            <Stop offset="100%" stopColor="#4A4E54" />
          </LinearGradient>
          <RadialGradient id="pondFill" cx="42%" cy="38%" r="58%">
            <Stop offset="0%" stopColor="#A8F0FF" />
            <Stop offset="45%" stopColor="#4AB8E0" />
            <Stop offset="100%" stopColor="#2878A8" />
          </RadialGradient>
          <LinearGradient id="dirtPad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#F0D4A0" />
            <Stop offset="100%" stopColor="#C89860" />
          </LinearGradient>
          <LinearGradient id="fenceWood" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#E8C888" />
            <Stop offset="100%" stopColor="#A87840" />
          </LinearGradient>
          <RadialGradient id="edgeMist" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
            <Stop offset="55%" stopColor="rgba(255,255,255,0.18)" />
            <Stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </RadialGradient>
          <RadialGradient id="bushGreen" cx="40%" cy="35%" r="65%">
            <Stop offset="0%" stopColor="#7AD850" />
            <Stop offset="100%" stopColor="#3F9A28" />
          </RadialGradient>
        </Defs>

        {/* Far hills */}
        <Ellipse cx={cx - 140} cy={cy - 118} rx={100} ry={30} fill="url(#hillFar)" opacity={0.5} />
        <Ellipse cx={cx + 110} cy={cy - 108} rx={120} ry={34} fill="url(#hillFar)" opacity={0.48} />
        <Ellipse cx={cx - 20} cy={cy - 125} rx={70} ry={22} fill="url(#hillNear)" opacity={0.4} />

        {/* Ground shadow */}
        <Ellipse
          cx={cx}
          cy={cy + rows * (TILE_H / 2) + 52}
          rx={cols * (TILE_W / 2) * 1.05}
          ry={48}
          fill="rgba(20,60,10,0.3)"
        />

        <Path d={lawn} fill="url(#lawnGlow)" />

        {/* Soft grass texture */}
        {Array.from({ length: 18 }).map((_, i) => (
          <Path
            key={`stripe-${i}`}
            d={`
              M ${cx - 180 + i * 16},${cy - 50 + (i % 3) * 14}
              L ${cx - 50 + i * 20},${cy + 100 + (i % 4) * 10}
            `}
            stroke={i % 2 ? 'rgba(255,255,180,0.14)' : 'rgba(30,110,20,0.11)'}
            strokeWidth={9}
            strokeLinecap="round"
            fill="none"
          />
        ))}

        {/* Dirt farm clearings */}
        <Ellipse cx={cx - 28} cy={cy + 18} rx={82} ry={42} fill="url(#dirtPad)" opacity={0.58} />
        <Ellipse cx={cx + 62} cy={cy + 62} rx={60} ry={32} fill="url(#dirtPad)" opacity={0.48} />

        {/* Painted starter farm diamonds on meadow */}
        <FarmDiamond cx={cx - 72} cy={cy + 52} w={50} h={28} />
        <FarmDiamond cx={cx - 22} cy={cy + 76} w={50} h={28} />
        <FarmDiamond cx={cx + 28} cy={cy + 52} w={50} h={28} />

        {/* Asphalt roads with center dashes */}
        <Path
          d={`
            M ${cx - 135},${cy - 72}
            Q ${cx - 40},${cy - 25} ${cx + 12},${cy + 30}
            L ${cx + 12},${cy + 150}
          `}
          stroke="#2E3238"
          strokeWidth={36}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={`
            M ${cx - 135},${cy - 72}
            Q ${cx - 40},${cy - 25} ${cx + 12},${cy + 30}
            L ${cx + 12},${cy + 150}
          `}
          stroke="url(#asphalt)"
          strokeWidth={28}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={`
            M ${cx + 12},${cy + 30}
            Q ${cx + 72},${cy + 8} ${cx + 140},${cy - 22}
          `}
          stroke="url(#asphalt)"
          strokeWidth={24}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={`
            M ${cx - 130},${cy - 70}
            Q ${cx - 38},${cy - 24} ${cx + 12},${cy + 28}
            L ${cx + 12},${cy + 145}
          `}
          stroke="#F4F4F4"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeDasharray="10 12"
          fill="none"
          opacity={0.95}
        />

        {/* Pond + reeds */}
        <Ellipse cx={cx + 118} cy={cy - 30} rx={48} ry={27} fill="url(#pondFill)" />
        <Ellipse
          cx={cx + 118}
          cy={cy - 30}
          rx={48}
          ry={27}
          fill="none"
          stroke="#1E6A90"
          strokeWidth={2.5}
          opacity={0.35}
        />
        <Ellipse cx={cx + 102} cy={cy - 36} rx={11} ry={4.5} fill="rgba(255,255,255,0.38)" />
        <Ellipse cx={cx + 100} cy={cy - 16} rx={5} ry={10} fill="#4EAE3A" />
        <Ellipse cx={cx + 130} cy={cy - 12} rx={4.5} ry={9} fill="#5ECF4A" />
        <Ellipse cx={cx + 142} cy={cy - 22} rx={4} ry={8} fill="#3F9A32" />
        <Ellipse cx={cx + 112} cy={cy - 10} rx={3.5} ry={7} fill="#62C448" />

        {/* Flower beds */}
        <Flower x={cx - 98} y={cy + 102} />
        <Flower x={cx + 55} y={cy + 112} />
        <Flower x={cx - 155} y={cy + 28} />
        <Flower x={cx + 22} y={cy - 72} />
        <Flower x={cx - 60} y={cy - 40} />
        <Flower x={cx + 90} y={cy + 95} />

        {/* Bushes */}
        <Bush x={cx - 120} y={cy + 88} />
        <Bush x={cx + 40} y={cy + 130} />
        <Bush x={cx - 170} y={cy + 10} />

        {/* Wooden fence near farm */}
        <Fence x={cx - 108} y={cy + 32} len={6} />

        {/* Dense tree ring */}
        <Tree x={cx - 158} y={cy - 12} scale={1.3} />
        <Tree x={cx - 180} y={cy + 52} scale={1} />
        <Tree x={cx - 105} y={cy + 132} scale={1.1} />
        <Tree x={cx + 48} y={cy + 148} scale={0.95} />
        <Tree x={cx + 155} y={cy + 82} scale={1.2} />
        <Tree x={cx + 170} y={cy + 18} scale={0.88} cypress />
        <Tree x={cx + 82} y={cy - 88} scale={0.95} cypress />
        <Tree x={cx - 45} y={cy - 105} scale={1.05} />
        <Tree x={cx + 165} y={cy - 52} scale={0.8} />
        <Tree x={cx - 190} y={cy - 40} scale={0.85} />
        <Tree x={cx + 5} y={cy + 155} scale={0.75} />

        {/* Soft edge mist only — far edges, never a diamond fog grid */}
        <Ellipse cx={cx - 210} cy={cy + 35} rx={78} ry={100} fill="url(#edgeMist)" />
        <Ellipse cx={cx + 220} cy={cy + 45} rx={82} ry={105} fill="url(#edgeMist)" />
        <Ellipse cx={cx} cy={cy + 210} rx={170} ry={58} fill="url(#edgeMist)" />
        <Ellipse cx={cx - 60} cy={cy - 140} rx={90} ry={40} fill="url(#edgeMist)" opacity={0.7} />

        {/* Speckle highlights */}
        {Array.from({ length: 56 }).map((_, i) => (
          <Circle
            key={i}
            cx={((i * 61) % (w - 50)) + 25}
            cy={((i * 89) % (h - 80)) + 40}
            r={1.5 + (i % 3) * 0.5}
            fill={i % 2 ? 'rgba(255,255,210,0.3)' : 'rgba(30,100,20,0.14)'}
          />
        ))}
      </Svg>
    </View>
  );
}

function FarmDiamond({
  cx,
  cy,
  w,
  h,
}: {
  cx: number;
  cy: number;
  w: number;
  h: number;
}) {
  return (
    <G>
      <Path
        d={`M ${cx},${cy - h / 2} L ${cx + w / 2},${cy} L ${cx},${cy + h / 2} L ${cx - w / 2},${cy} Z`}
        fill="#B88848"
        stroke="#7A5028"
        strokeWidth={1.5}
        opacity={0.88}
      />
      {[0.32, 0.5, 0.68].map((t, i) => (
        <Path
          key={i}
          d={`M ${cx - w * (0.32 - i * 0.04)},${cy - h / 2 + h * t} L ${cx + w * (0.32 - i * 0.04)},${cy - h / 2 + h * t}`}
          stroke="rgba(60,35,10,0.28)"
          strokeWidth={1.4}
        />
      ))}
    </G>
  );
}

function Flower({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={3.2} fill="#F5C84A" />
      <Circle cx={x - 5} cy={y + 1} r={2.8} fill="#F070A0" />
      <Circle cx={x + 5} cy={y} r={2.8} fill="#F070A0" />
      <Circle cx={x + 1} cy={y - 5} r={2.6} fill="#E85890" />
      <Circle cx={x} cy={y} r={1.6} fill="#FFF4A0" />
    </G>
  );
}

function Bush({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Ellipse cx={x} cy={y + 6} rx={14} ry={5} fill="rgba(20,50,10,0.22)" />
      <Ellipse cx={x} cy={y} rx={12} ry={9} fill="url(#bushGreen)" />
      <Ellipse cx={x - 7} cy={y + 2} rx={8} ry={7} fill="#58B838" />
      <Ellipse cx={x + 7} cy={y + 1} rx={7} ry={6} fill="#4EAE30" />
    </G>
  );
}

function Fence({ x, y, len }: { x: number; y: number; len: number }) {
  return (
    <G>
      {Array.from({ length: len }).map((_, i) => (
        <G key={i}>
          <Rect
            x={x + i * 14}
            y={y}
            width={3.5}
            height={14}
            rx={1}
            fill="url(#fenceWood)"
          />
          <Rect x={x + i * 14 - 2} y={y + 3} width={12} height={2.5} rx={1} fill="#C89858" />
          <Rect x={x + i * 14 - 2} y={y + 8} width={12} height={2.5} rx={1} fill="#C89858" />
        </G>
      ))}
    </G>
  );
}

function Tree({
  x,
  y,
  scale = 1,
  cypress = false,
}: {
  x: number;
  y: number;
  scale?: number;
  cypress?: boolean;
}) {
  if (cypress) {
    return (
      <G>
        <Ellipse
          cx={x}
          cy={y + 12 * scale}
          rx={7 * scale}
          ry={3.5 * scale}
          fill="rgba(20,45,10,0.3)"
        />
        <Path
          d={`M ${x},${y - 28 * scale} L ${x + 8 * scale},${y + 8 * scale} L ${x - 8 * scale},${y + 8 * scale} Z`}
          fill="#2E8A28"
        />
        <Path
          d={`M ${x},${y - 18 * scale} L ${x + 10 * scale},${y + 10 * scale} L ${x - 10 * scale},${y + 10 * scale} Z`}
          fill="#4EAE38"
        />
        <Path
          d={`M ${x},${y - 8 * scale} L ${x + 11 * scale},${y + 12 * scale} L ${x - 11 * scale},${y + 12 * scale} Z`}
          fill="#62C448"
        />
      </G>
    );
  }
  return (
    <G>
      <Ellipse
        cx={x}
        cy={y + 14 * scale}
        rx={12 * scale}
        ry={5 * scale}
        fill="rgba(20,45,10,0.32)"
      />
      <Rect
        x={x - 3 * scale}
        y={y}
        width={6 * scale}
        height={14 * scale}
        fill="#8B5A2B"
        rx={1.5}
      />
      <Ellipse cx={x} cy={y - 8 * scale} rx={16 * scale} ry={14 * scale} fill="#3F9A28" />
      <Ellipse
        cx={x - 8 * scale}
        cy={y - 2 * scale}
        rx={11 * scale}
        ry={10 * scale}
        fill="#58B838"
      />
      <Ellipse
        cx={x + 9 * scale}
        cy={y - 4 * scale}
        rx={10 * scale}
        ry={9 * scale}
        fill="#4EAE30"
      />
      <Ellipse
        cx={x + 2 * scale}
        cy={y - 14 * scale}
        rx={9 * scale}
        ry={8 * scale}
        fill="#6AD04A"
      />
    </G>
  );
}

/** Soft farm soil / ripe wheat field — dark soil with furrows, golden when ready. */
export function FarmBed({
  width = 78,
  height = 44,
  ready = false,
  selected = false,
  uid = 'fb',
}: {
  width?: number;
  height?: number;
  ready?: boolean;
  selected?: boolean;
  uid?: string;
}) {
  const hw = width / 2;
  const hh = height / 2;
  const gid = `soil-${uid}`;
  const top = ready ? '#F8E060' : '#8B6038';
  const mid = ready ? '#E8C838' : '#6E4828';
  const bot = ready ? '#C89820' : '#4A3018';

  return (
    <View style={{ width, height: height + 12 }}>
      <Svg width={width} height={height + 12}>
        <Defs>
          <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={top} />
            <Stop offset="55%" stopColor={mid} />
            <Stop offset="100%" stopColor={bot} />
          </LinearGradient>
        </Defs>
        <Ellipse
          cx={hw}
          cy={hh + 10}
          rx={hw * 0.92}
          ry={hh * 0.52}
          fill="rgba(30,20,8,0.4)"
        />
        <Path
          d={`M ${hw},2 L ${width - 4},${hh} L ${hw},${height} L 4,${hh} Z`}
          fill={`url(#${gid})`}
          stroke={selected ? '#FFE566' : 'rgba(40,25,10,0.45)'}
          strokeWidth={selected ? 2.5 : 1.6}
        />
        {[0.22, 0.36, 0.5, 0.64, 0.78].map((t, i) => (
          <Path
            key={i}
            d={`M ${hw * (1 - t) + 6},${hh * t + 3} L ${hw * (1 + t) - 6},${hh * t + 3}`}
            stroke={ready ? 'rgba(140,100,10,0.55)' : 'rgba(30,18,8,0.35)'}
            strokeWidth={ready ? 3.2 : 1.8}
            strokeLinecap="round"
          />
        ))}
        {ready &&
          [0.3, 0.5, 0.7].map((t, i) => (
            <Ellipse
              key={`g${i}`}
              cx={hw}
              cy={hh * t + 4}
              rx={hw * 0.28}
              ry={3}
              fill="rgba(255,240,120,0.35)"
            />
          ))}
      </Svg>
    </View>
  );
}

/** Soft circular mist puff + gold coin price — no diamond tile, no cloud emoji. */
export function FogPatch({
  width = 70,
  height = 40,
  selected = false,
  price,
}: {
  width?: number;
  height?: number;
  selected?: boolean;
  price?: number;
}) {
  const hw = width / 2;
  const hh = height / 2;
  const gid = `mist-${price ?? 'x'}-${Math.round(width)}`;
  return (
    <View style={{ width: Math.max(width, 72), height: height + 32, alignItems: 'center' }}>
      <Svg width={width} height={height + 4}>
        <Defs>
          <RadialGradient id={gid} cx="50%" cy="55%" r="55%">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.78)" />
            <Stop offset="65%" stopColor="rgba(235,245,255,0.38)" />
            <Stop offset="100%" stopColor="rgba(235,245,255,0)" />
          </RadialGradient>
        </Defs>
        <Ellipse cx={hw} cy={hh + 2} rx={hw * 0.9} ry={hh * 0.8} fill={`url(#${gid})`} />
        <Ellipse cx={hw * 0.5} cy={hh} rx={15} ry={9} fill="rgba(255,255,255,0.55)" />
        <Ellipse cx={hw * 1.4} cy={hh * 0.95} rx={13} ry={8} fill="rgba(255,255,255,0.42)" />
        <Ellipse cx={hw} cy={hh * 0.7} rx={10} ry={6} fill="rgba(255,255,255,0.35)" />
        {selected && (
          <Ellipse
            cx={hw}
            cy={hh}
            rx={hw * 0.72}
            ry={hh * 0.58}
            fill="none"
            stroke="#FFE566"
            strokeWidth={2}
          />
        )}
      </Svg>
      {price != null && (
        <View style={styles.priceBadge}>
          <View style={styles.coinDot} />
          <Text style={styles.priceText}>{price}</Text>
        </View>
      )}
    </View>
  );
}

export function BuildingShadow({ width = 80 }: { width?: number }) {
  return (
    <View style={[styles.bShadow, { width, height: width * 0.34 }]} pointerEvents="none">
      <Svg width={width} height={width * 0.34}>
        <Ellipse
          cx={width / 2}
          cy={width * 0.17}
          rx={width * 0.4}
          ry={width * 0.12}
          fill="rgba(20,40,10,0.36)"
        />
      </Svg>
    </View>
  );
}

type SpriteKind = 'house' | 'barn' | 'bakery' | 'factory' | 'decor' | string;

function resolveSpriteKind(kind: string): SpriteKind {
  if (kind === 'barn') return 'barn';
  if (kind === 'bakery') return 'bakery';
  if (
    [
      'feed_mill',
      'dairy',
      'sugar_mill',
      'juice_plant',
      'textile_mill',
    ].includes(kind)
  ) {
    return 'factory';
  }
  if (
    ['flower_bed', 'park', 'lamp', 'road', 'fence', 'fountain', 'well', 'statue'].includes(
      kind
    )
  ) {
    return 'decor';
  }
  return 'house';
}

/** Playrix-style cartoon isometric cottage — original art, ~90×85, no emoji. */
export function BuildingSprite({
  accent = '#F5D8B0',
  roof = '#D05048',
  selected = false,
  uid = 'b',
  kind = 'house',
}: {
  accent?: string;
  roof?: string;
  selected?: boolean;
  uid?: string;
  kind?: string;
}) {
  const sprite = resolveSpriteKind(kind);
  const wall = `wall-${uid}`;
  const roofG = `roof-${uid}`;
  const W = 90;
  const H = 85;

  if (sprite === 'decor') {
    return <DecorSprite kind={kind} selected={selected} uid={uid} />;
  }

  const wallTop =
    sprite === 'barn' ? '#E87048' : sprite === 'bakery' ? '#F8E8C8' : accent;
  const wallBot =
    sprite === 'barn' ? '#C04828' : sprite === 'bakery' ? '#E0C898' : '#C88858';
  const roofTop =
    sprite === 'barn' ? '#8B2018' : sprite === 'bakery' ? '#D84838' : roof;
  const roofBot =
    sprite === 'barn' ? '#5A1008' : sprite === 'bakery' ? '#982818' : '#8B2818';

  return (
    <View style={styles.sprite} pointerEvents="none">
      <Svg width={W} height={H}>
        <Defs>
          <LinearGradient id={wall} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={wallTop} />
            <Stop offset="100%" stopColor={wallBot} />
          </LinearGradient>
          <LinearGradient id={roofG} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={roofTop} />
            <Stop offset="100%" stopColor={roofBot} />
          </LinearGradient>
        </Defs>

        {/* Soft ground shadow */}
        <Ellipse cx={45} cy={78} rx={30} ry={6} fill="rgba(20,40,10,0.32)" />

        {/* Grass tufts at base */}
        <Ellipse cx={18} cy={74} rx={5} ry={3} fill="#58B838" />
        <Ellipse cx={72} cy={74} rx={5} ry={3} fill="#4EAE30" />
        <Ellipse cx={28} cy={76} rx={4} ry={2.5} fill="#6AD048" />
        <Ellipse cx={62} cy={76} rx={4} ry={2.5} fill="#62C448" />

        {/* Body */}
        <Rect
          x={16}
          y={34}
          width={58}
          height={38}
          rx={5}
          fill={`url(#${wall})`}
          stroke={selected ? '#FFE566' : 'rgba(60,35,15,0.28)'}
          strokeWidth={selected ? 2.8 : 1.3}
        />

        {/* Side shade for isometric feel */}
        <Path
          d="M 74,34 L 82,40 L 82,72 L 74,72 Z"
          fill="rgba(40,25,10,0.12)"
        />

        {/* Roof with highlight */}
        <Path
          d="M 8,36 L 45,6 L 82,36 Z"
          fill={`url(#${roofG})`}
          stroke="rgba(60,20,10,0.3)"
          strokeWidth={1.3}
        />
        <Path d="M 20,32 L 45,10 L 55,20 Z" fill="rgba(255,255,255,0.22)" />

        {/* Chimney + smoke puff */}
        {sprite !== 'barn' && (
          <>
            <Rect x={62} y={14} width={10} height={16} rx={1.5} fill="#A85840" />
            <Rect x={60} y={12} width={14} height={5} rx={1.5} fill="#8B4030" />
            <Ellipse cx={67} cy={8} rx={5} ry={3.5} fill="rgba(220,225,230,0.75)" />
            <Ellipse cx={70} cy={4} rx={4} ry={3} fill="rgba(230,235,240,0.55)" />
            <Ellipse cx={64} cy={2} rx={3} ry={2.5} fill="rgba(240,245,250,0.4)" />
          </>
        )}

        {/* Factory stack */}
        {sprite === 'factory' && (
          <>
            <Rect x={22} y={18} width={12} height={18} rx={1.5} fill="#8898A8" />
            <Rect x={24} y={14} width={8} height={6} rx={1} fill="#687888" />
            <Ellipse cx={28} cy={11} rx={4} ry={3} fill="rgba(200,210,220,0.75)" />
            <Ellipse cx={30} cy={6} rx={5} ry={3.5} fill="rgba(210,220,230,0.5)" />
          </>
        )}

        {/* Barn loft door */}
        {sprite === 'barn' && (
          <>
            <Path d="M 35,28 L 45,18 L 55,28 Z" fill="#F0C878" opacity={0.9} />
            <Rect x={38} y={30} width={14} height={12} rx={1} fill="#6A3020" />
          </>
        )}

        {/* Porch */}
        <Rect x={32} y={68} width={26} height={5} rx={1.5} fill="#C89860" />
        <Rect x={30} y={71} width={30} height={3} rx={1} fill="#A87840" />

        {/* Door */}
        <Rect x={38} y={46} width={14} height={22} rx={2.5} fill="#6A4028" />
        <Circle cx={49} cy={57} r={1.6} fill="#F0D878" />

        {/* Shuttered windows */}
        <Window x={20} y={40} />
        <Window x={56} y={40} />

        {/* Bakery awning */}
        {sprite === 'bakery' && (
          <Path
            d="M 18,38 L 72,38 L 70,44 L 20,44 Z"
            fill="#E84858"
            opacity={0.9}
          />
        )}
      </Svg>
    </View>
  );
}

function Window({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Rect x={x - 2} y={y} width={3} height={11} rx={0.5} fill="#C04038" />
      <Rect x={x + 11} y={y} width={3} height={11} rx={0.5} fill="#C04038" />
      <Rect x={x + 1} y={y + 1} width={10} height={9} rx={1.5} fill="#A8E8FF" />
      <Path
        d={`M ${x + 1},${y + 5.5} L ${x + 11},${y + 5.5} M ${x + 6},${y + 1} L ${x + 6},${y + 10}`}
        stroke="rgba(255,255,255,0.6)"
        strokeWidth={1}
      />
      <Rect x={x + 2} y={y + 2} width={3.5} height={2.5} fill="rgba(255,255,255,0.55)" />
    </G>
  );
}

function DecorSprite({
  kind,
  selected,
  uid,
}: {
  kind: string;
  selected: boolean;
  uid: string;
}) {
  const stroke = selected ? '#FFE566' : 'transparent';
  return (
    <View style={styles.sprite} pointerEvents="none">
      <Svg width={70} height={60}>
        <Ellipse cx={35} cy={52} rx={18} ry={5} fill="rgba(20,40,10,0.28)" />
        {kind === 'road' && (
          <Path
            d="M 35,18 L 58,35 L 35,52 L 12,35 Z"
            fill="#6A6E74"
            stroke={stroke}
            strokeWidth={2}
          />
        )}
        {kind === 'flower_bed' && (
          <>
            <Ellipse cx={35} cy={40} rx={20} ry={12} fill="#6E4828" stroke={stroke} strokeWidth={2} />
            <Circle cx={28} cy={36} r={4} fill="#F070A0" />
            <Circle cx={38} cy={34} r={4} fill="#F5C84A" />
            <Circle cx={42} cy={40} r={3.5} fill="#E85890" />
            <Circle cx={30} cy={42} r={3} fill="#F070A0" />
          </>
        )}
        {kind === 'park' && (
          <>
            <Rect x={32} y={38} width={6} height={12} fill="#8B5A2B" rx={1} />
            <Ellipse cx={35} cy={30} rx={16} ry={14} fill="#4EAE30" stroke={stroke} strokeWidth={2} />
            <Ellipse cx={28} cy={34} rx={10} ry={9} fill="#58B838" />
            <Ellipse cx={42} cy={32} rx={9} ry={8} fill="#6AD048" />
          </>
        )}
        {kind === 'lamp' && (
          <>
            <Rect x={33} y={28} width={4} height={24} fill="#687888" rx={1} />
            <Ellipse cx={35} cy={24} rx={8} ry={6} fill="#F5E070" stroke={stroke} strokeWidth={2} />
            <Ellipse cx={35} cy={22} rx={4} ry={3} fill="#FFF8C0" />
          </>
        )}
        {(kind === 'fence' || kind === 'well' || kind === 'fountain' || kind === 'statue') && (
          <>
            <Ellipse
              cx={35}
              cy={40}
              rx={16}
              ry={10}
              fill={kind === 'fountain' ? '#4AB8E0' : '#A8B8C8'}
              stroke={stroke}
              strokeWidth={2}
            />
            <Rect x={28} y={28} width={14} height={16} rx={2} fill="#8898A8" />
          </>
        )}
      </Svg>
    </View>
  );
}

export function buildingColors(buildingId?: string): {
  accent: string;
  roof: string;
} {
  switch (buildingId) {
    case 'barn':
      return { accent: '#E87848', roof: '#8B2818' };
    case 'bakery':
      return { accent: '#F2D090', roof: '#C84838' };
    case 'house':
      return { accent: '#F8E0C0', roof: '#D84840' };
    case 'chicken_coop':
      return { accent: '#E8C090', roof: '#A04828' };
    case 'dairy':
      return { accent: '#E8E4DC', roof: '#6888A8' };
    case 'feed_mill':
      return { accent: '#D4B898', roof: '#687848' };
    case 'sugar_mill':
      return { accent: '#F0E8E0', roof: '#C07090' };
    case 'juice_plant':
      return { accent: '#C8E878', roof: '#488838' };
    case 'textile_mill':
      return { accent: '#E8D8F0', roof: '#785898' };
    case 'pigsty':
      return { accent: '#F0C8B8', roof: '#A85848' };
    case 'sheep_pen':
      return { accent: '#F0F0E8', roof: '#889090' };
    case 'beehive':
      return { accent: '#F5E070', roof: '#C88828' };
    case 'apartment':
      return { accent: '#D0D8E8', roof: '#486888' };
    case 'cafe':
      return { accent: '#E8D0B0', roof: '#785838' };
    case 'school':
      return { accent: '#D0E8F0', roof: '#3878A8' };
    case 'hospital':
      return { accent: '#F0E8E8', roof: '#C05050' };
    case 'market':
      return { accent: '#F0D890', roof: '#A86828' };
    case 'road':
      return { accent: '#B0A898', roof: '#787068' };
    case 'fountain':
    case 'lamp':
    case 'fence':
      return { accent: '#A8C0D0', roof: '#607888' };
    case 'park':
    case 'flower_bed':
      return { accent: '#90D060', roof: '#488838' };
    case 'well':
      return { accent: '#A8B8C8', roof: '#607080' };
    case 'statue':
      return { accent: '#C8C0B0', roof: '#908878' };
    default:
      return { accent: '#F5D8B0', roof: '#D4543A' };
  }
}

export function SelectGlow({
  width = 82,
  height = 46,
}: {
  width?: number;
  height?: number;
}) {
  const hw = width / 2;
  const hh = height / 2;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height}>
        <Path
          d={`M ${hw},1 L ${width - 1},${hh} L ${hw},${height - 1} L 1,${hh} Z`}
          fill="rgba(255,230,80,0.18)"
          stroke="#FFE566"
          strokeWidth={2.5}
        />
      </Svg>
    </View>
  );
}

export const TOWN_TILE = { W: TILE_W, H: TILE_H };

const styles = StyleSheet.create({
  meadow: { position: 'absolute', left: -20, top: -10 },
  bShadow: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
  },
  sprite: {
    position: 'absolute',
    top: -28,
    alignSelf: 'center',
  },
  priceBadge: {
    marginTop: -4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,248,230,0.96)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0A820',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  coinDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#F0C040',
    borderWidth: 1.5,
    borderColor: '#C89020',
  },
  priceText: {
    fontFamily: fonts.bodyExtra,
    fontSize: 12,
    color: '#5A3A10',
  },
});
