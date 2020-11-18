import './App.css';
import { ControlledEditor } from "@monaco-editor/react";
import { SetControlColormap, SetInputRange, SetProgressBar, SetViewVolumetric } from '@sethealth/react';
import { useState } from 'react';
import { CODE } from './code';
import useDebounce from './debounce';
import * as sethealth from '@sethealth/core';

const MEDICAL_IMAGE = "https://public1-eu-sethealth.ams3.cdn.digitaloceanspaces.com/public/ankle.nrrd.gz";

const COLORMAP  = {
  type: 'linear',
  name: 'initial',
  color: [0,0,0,255],
  colorEnd: [255, 255, 255,255],
};

export default function App() {
  const [workspace, setWorkspace] = useState(undefined);
  const [loading, setLoading] = useState();
  const [shader, setShader] = useState(CODE);
  const [colormap, setColormap] = useState(COLORMAP);
  const [ambientLight, setAmbientLight] = useState(0.1);
  const [directLight, setDirectLight] = useState(0.1);
  const [specularLight, setSpecularLight] = useState(0.1);
  const [cutLow, setCutLow] = useState(MIN_HU);
  const [cutHigh, setCutHigh] = useState(MAX_HU);

  const debouncedShader = useDebounce(shader, 800);

  return (
    <div className="App">
      <header>
        Sethealth Shader Test
      </header>
      {workspace && (
        <>
          <div className="panel">
            <ControlledEditor
              width="55vw"
              height="100%"
              language="cpp"
              options={{
                'minimap': {
                  enabled: false
                }
              }}
              onChange={(_, value) => {
                setShader(value)
              }}
              value={shader}
            />
            <SetViewVolumetric
              pixelRatio={0.5}
              className="volumetric"
              ambientLight={ambientLight}
              diffuseLight={directLight}
              specularLight={specularLight}
              lowCut={cutLow}
              highCut={cutHigh}
              colormap={colormap}
              fragmentShader={debouncedShader}
              workspace={workspace}
            />
            <div className="sidemenu">
              <SetControlColormap
                colormaps="all"
                onSetChange={(ev) => setColormap(ev.detail)}
              />
              <SetInputRange
                header="Ambient"
                value={ambientLight}
                onSetChange={(ev) => setAmbientLight(ev.detail)}
              />
              <SetInputRange
                header="Diffuse"
                value={directLight}
                onSetChange={(ev) => setDirectLight(ev.detail)}
              />
              <SetInputRange
                header="Specular"
                value={specularLight}
                onSetChange={(ev) => setSpecularLight(ev.detail)}
              />
              <SetInputRange
                header="Low cut"
                min={MIN_HU}
                max={MAX_HU}
                value={cutLow}
                onSetChange={(ev) => {console.log(ev);setCutLow(ev.detail)}}
              />
              <SetInputRange
                header="High cut"
                min={MIN_HU}
                max={MAX_HU}
                value={cutHigh}
                onSetChange={(ev) => setCutHigh(ev.detail)}
              />
            </div>
          </div>
        </>
      )}
      {loading !== undefined && loading < 1.0 && (
        <SetProgressBar value={loading}/>
      )}
      {!workspace && (
        <button onClick={async () => {
          const result = await sethealth.med.loadFromSource({
            type: 'nrrd',
            input: MEDICAL_IMAGE,
          }, (progress) => setLoading(progress));
          if (!result.error) {
            const handler = result.value[0];
            const workspace = await sethealth.workspace.create(handler);
            setWorkspace(workspace);
          }
        }}>
          Load
        </button>
      )}
    </div>
  );
}

const MIN_HU = -1024;
const MAX_HU = 7178;
