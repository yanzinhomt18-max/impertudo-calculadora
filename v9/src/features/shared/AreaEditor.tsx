import type { AreaMode, AreaResult } from '../../engine/geometry'
import { calculateArea } from '../../engine/geometry'

export interface AreaEditorState {
  mode: AreaMode
  directAreaM2: number
  lengthM: number
  widthM: number
  perimeterM: number
  heightM: number
  wastePercent: number
}

export const defaultAreaEditorState: AreaEditorState = {
  mode: 'direct', directAreaM2: 20, lengthM: 5, widthM: 4, perimeterM: 18, heightM: 1, wastePercent: 5
}

export function resolveAreaEditor(state: AreaEditorState): AreaResult {
  return calculateArea({
    mode: state.mode,
    directAreaM2: state.mode === 'direct' ? state.directAreaM2 : undefined,
    lengthM: state.mode === 'rectangle' ? state.lengthM : undefined,
    widthM: state.mode === 'rectangle' ? state.widthM : undefined,
    perimeterM: state.mode === 'perimeter-height' ? state.perimeterM : undefined,
    heightM: state.mode === 'perimeter-height' ? state.heightM : undefined,
    wastePercent: state.wastePercent
  })
}

export default function AreaEditor({ value, onChange }: { value: AreaEditorState; onChange: (value: AreaEditorState) => void }) {
  const patch = (next: Partial<AreaEditorState>) => onChange({ ...value, ...next })
  return <div className="areaEditor">
    <label className="stackField"><span>Como deseja informar a área?</span><select value={value.mode} onChange={(e) => patch({ mode: e.target.value as AreaMode })}><option value="direct">Área pronta em m²</option><option value="rectangle">Comprimento × largura</option><option value="perimeter-height">Perímetro × altura</option></select></label>
    {value.mode === 'direct' && <label className="stackField"><span>Área (m²)</span><input type="number" min="0" step="0.01" value={value.directAreaM2} onChange={(e) => patch({ directAreaM2: Number(e.target.value) })} /></label>}
    {value.mode === 'rectangle' && <div className="fieldGrid two"><label><span>Comprimento (m)</span><input type="number" min="0" step="0.01" value={value.lengthM} onChange={(e) => patch({ lengthM: Number(e.target.value) })} /></label><label><span>Largura (m)</span><input type="number" min="0" step="0.01" value={value.widthM} onChange={(e) => patch({ widthM: Number(e.target.value) })} /></label></div>}
    {value.mode === 'perimeter-height' && <div className="fieldGrid two"><label><span>Perímetro (m)</span><input type="number" min="0" step="0.01" value={value.perimeterM} onChange={(e) => patch({ perimeterM: Number(e.target.value) })} /></label><label><span>Altura (m)</span><input type="number" min="0" step="0.01" value={value.heightM} onChange={(e) => patch({ heightM: Number(e.target.value) })} /></label></div>}
    <div className="marginChooser"><span>Margem de segurança</span><div className="segmented"><button className={value.wastePercent === 0 ? 'active' : ''} onClick={() => patch({ wastePercent: 0 })}>0%</button><button className={value.wastePercent === 5 ? 'active' : ''} onClick={() => patch({ wastePercent: 5 })}>5%</button><button className={value.wastePercent === 10 ? 'active' : ''} onClick={() => patch({ wastePercent: 10 })}>10%</button></div><label><span>Personalizada (%)</span><input type="number" min="0" max="50" step="1" value={value.wastePercent} onChange={(e) => patch({ wastePercent: Number(e.target.value) })} /></label><small>5% é uma referência prática para base regular; aumente apenas quando recortes, irregularidade ou perdas de aplicação justificarem.</small></div>
  </div>
}
