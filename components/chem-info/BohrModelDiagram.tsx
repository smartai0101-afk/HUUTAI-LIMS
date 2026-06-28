"use client";

type Props = {
  symbol: string;
  shells: number[];
};

const VIEW_SIZE = 200;
const CENTER = VIEW_SIZE / 2;
const NUCLEUS_RADIUS = 14;
const SHELL_GAP = 22;

function shellRadius(index: number) {
  return NUCLEUS_RADIUS + 10 + index * SHELL_GAP;
}

function electronPositions(count: number, radius: number, center: number) {
  if (count <= 0) return [];
  const positions: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < count; i += 1) {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    positions.push({
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    });
  }
  return positions;
}

export function BohrModelDiagram({ symbol, shells }: Props) {
  if (shells.length === 0) return null;

  return (
    <svg
      viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
      className="mx-auto w-full max-w-[200px]"
      role="img"
      aria-label={`Mô hình Bohr ${symbol}: ${shells.join(", ")} electron mỗi lớp`}
    >
      {shells.map((count, index) => {
        const radius = shellRadius(index);
        const labelY = CENTER - radius - 4;
        return (
          <g key={`shell-${index}`}>
            <circle
              cx={CENTER}
              cy={CENTER}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
              className="text-cyan-300"
            />
            <text
              x={CENTER}
              y={labelY < 12 ? 12 : labelY}
              textAnchor="middle"
              className="fill-slate-500 text-[9px]"
            >
              {count}
            </text>
            {count <= 8
              ? electronPositions(count, radius, CENTER).map((pos, eIndex) => (
                  <circle
                    key={`e-${index}-${eIndex}`}
                    cx={pos.x}
                    cy={pos.y}
                    r={3}
                    className="fill-cyan-500"
                  />
                ))
              : null}
          </g>
        );
      })}
      <circle cx={CENTER} cy={CENTER} r={NUCLEUS_RADIUS} className="fill-cyan-100 stroke-cyan-400" strokeWidth={1} />
      <text
        x={CENTER}
        y={CENTER + 4}
        textAnchor="middle"
        className="fill-cyan-800 text-[11px] font-semibold"
      >
        {symbol}
      </text>
    </svg>
  );
}
