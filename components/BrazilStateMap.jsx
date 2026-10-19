import Link from "next/link";
import { brazilStates } from "../lib/brazil-states";

const TILE_WIDTH = 42;
const TILE_HEIGHT = 40;

export default function BrazilStateMap() {
  return (
    <div className="state-map-wrap">
      <svg
        className="state-map"
        viewBox="0 0 400 476"
        role="group"
        aria-label="Mapa interativo do Brasil. Escolha um estado para ver os concursos relacionados."
      >
        {brazilStates.map((state) => (
          <Link
            key={state.code}
            href={`/blog?estado=${state.code}`}
            className="state-map-link"
            aria-label={`Ver concursos em ${state.name}`}
          >
            <g transform={`translate(${state.x} ${state.y})`}>
              <rect
                className="state-map-tile"
                width={TILE_WIDTH}
                height={TILE_HEIGHT}
                rx="9"
                fill={state.color}
              />
              <text
                className="state-map-code"
                x={TILE_WIDTH / 2}
                y={TILE_HEIGHT / 2 + 5}
                textAnchor="middle"
              >
                {state.code}
              </text>
              <title>{`${state.name} — ver concursos relacionados`}</title>
            </g>
          </Link>
        ))}
      </svg>
      <form action="/blog" method="get" className="state-map-picker">
        <label htmlFor="home-state-picker">Escolha seu estado</label>
        <div className="state-map-picker-controls">
          <select id="home-state-picker" name="estado" defaultValue="">
            <option value="" disabled>Selecione um estado</option>
            {brazilStates
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
              .map((state) => (
                <option key={state.code} value={state.code}>{state.name}</option>
              ))}
          </select>
          <button className="btn btn--hl" type="submit">Ver concursos</button>
        </div>
      </form>
      <p className="state-map-hint">Toque em um estado ou selecione-o na lista.</p>
    </div>
  );
}
