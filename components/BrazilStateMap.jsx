import { brazilStates } from "../lib/brazil-states";
import { brazilStateBoundaries } from "../lib/brazil-state-boundaries";

export default function BrazilStateMap() {
  return (
    <div className="state-map-wrap">
      <svg
        className="state-map"
        viewBox="0 0 500 520"
        role="group"
        aria-label="Mapa interativo do Brasil. Toque em um estado para ver concursos relacionados."
      >
        {brazilStates.map((state) => (
          <a
            key={state.code}
            href={`/blog?estado=${encodeURIComponent(state.code)}`}
            className="state-map-link"
            aria-label={`Ver concursos em ${state.name}`}
            style={{ "--state-color": state.color }}
          >
            <path
              className="state-map-shape"
              d={brazilStateBoundaries[state.code].path}
            />
            <text
              className="state-map-code"
              x={brazilStateBoundaries[state.code].label[0]}
              y={brazilStateBoundaries[state.code].label[1]}
              textAnchor="middle"
              dominantBaseline="central"
              aria-hidden="true"
            >
              {state.code}
            </text>
            <title>{`Ver concursos em ${state.name}`}</title>
          </a>
        ))}
      </svg>
      <p className="state-map-hint">Toque em um estado do mapa para ver os concursos relacionados.</p>
    </div>
  );
}
