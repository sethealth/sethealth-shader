import './App.css';
import { ControlledEditor } from "@monaco-editor/react";
import { SetControlColormap, SetIcon, SetInputRange, SetProgressBar, SetViewVolumetric } from '@sethealth/react';
import { useEffect, useMemo, useState } from 'react';
import SHADERS from './code';
import useDebounce from './debounce';
import * as sethealth from '@sethealth/core';

const MEDICAL_IMAGE = "https://public1-eu-sethealth.ams3.cdn.digitaloceanspaces.com/public/ankle.nrrd.gz";

const prefix = "#";

const COLORMAP = {
  type: 'materials',
  name: 'Initial',
  materials: [
    {
      name: "Bone",
      from: 400,
      to: 2000,
      color: [255,255,255,255],
    }
  ]
};

const getInitialState = () => {
  let fragment = getFragment();
  if (fragment === "") {
    fragment = "max-intensity";
  }
  if (fragment in SHADERS) {
    return {
      shader: SHADERS[fragment],
      shaderName: fragment,
      colormap: COLORMAP,
      ambientLight: 0.25,
      directLight: 0.60,
      specularLight: 0.24,
      cutLow: MIN_HU,
      cutHigh: MAX_HU,
    };
  } else {
    return JSON.parse(atob(fragment));
  }
}

const getFragment = () => {
  const fragment = window.location.hash;
  if (fragment.startsWith(prefix)) {
    return fragment.slice(prefix.length);
  }
  return "";
};

export default function App() {

  const state = useMemo(() => getInitialState(), []);
  const [workspace, setWorkspace] = useState(undefined);
  const [loading, setLoading] = useState();
  const [shader, setShader] = useState(state.shader);
  const [shaderName, setShaderName] = useState(state.shaderName);
  const [colormap, setColormap] = useState(state.colormap);
  const [ambientLight, setAmbientLight] = useState(state.ambientLight);
  const [directLight, setDirectLight] = useState(state.directLight);
  const [specularLight, setSpecularLight] = useState(state.specularLight);
  const [cutLow, setCutLow] = useState(state.cutLow);
  const [cutHigh, setCutHigh] = useState(state.cutHigh);
  const debouncedShader = useDebounce(shader, 800);

  useEffect(() => {
    async function load() {
      const result = await sethealth.med.loadFromSource({
        type: 'nrrd',
        input: MEDICAL_IMAGE,
      }, (progress) => setLoading(progress));
      if (!result.error) {
        const handler = result.value[0];
        const workspace = await sethealth.workspace.create(handler);
        setWorkspace(workspace);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (shaderName === "custom") {
      const state = JSON.stringify({
        shader: shader,
        shaderName: "custom",
        colormap,
        ambientLight,
        directLight,
        specularLight,
        cutLow,
        cutHigh,
      });
      window.location.hash = prefix + btoa(state);
    } else {
      window.location.hash = prefix + shaderName;
    }
  }, [shaderName, colormap, ambientLight, directLight, specularLight, cutLow, cutHigh, shader]);

  return (
    <div className="App">
        <header>
          <a href="https://set.health" className="logo" >
            <SetIcon name="sethealth"/>
          </a>
          Sethealth Shader Playground
          {workspace && (
            <select value={shaderName} onChange={(ev) => {
              const value = ev.target.value;
              const code = SHADERS[value];
              if (code) {
                setShaderName(value);
                setShader(code);
              }
            }}>
              <option value="max-intensity">Max-intensity</option>
              <option value="basic">Basic</option>
              <option value="lighting">Lighting</option>
              <option value="custom" disabled>Custom</option>
            </select>
          )}
          <nav className="top-menu">
            <a class="link" href="https://docs.set.health">
              <SetIcon name="document"></SetIcon>
              Docs
            </a>
          </nav>
        </header>
      {workspace && (
        <>
          <div className="panel">
            <ControlledEditor
              width="40vw"
              height="100%"
              language="cpp"
              options={{
                'minimap': {
                  enabled: false
                }
              }}
              onChange={(_, value) => {
                setShaderName("custom");
                setShader(value);
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
                className="colormap"
                colormaps="all"
                colormap={colormap}
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
    </div>
  );
}

const MIN_HU = -1024;
const MAX_HU = 7178;
