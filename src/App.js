import './App.css';
import { ControlledEditor } from "@monaco-editor/react";
import { SetControlColormap, SetIcon, SetInputRange, SetProgressBar, SetViewVolumetric } from '@sethealth/react';
import { useEffect, useMemo, useState } from 'react';
import SHADERS from './code';
import useDebounce from './debounce';
import * as sethealth from '@sethealth/core';
import ResizePanel from "react-resize-panel";

const MEDICAL_IMAGE = "https://public.sethealth.app/ankle.nrrd.gz";

const prefix = "#";

const COLORMAP = {
  type: "materials",
  name: "Bones",
  materials: [
    {
      name: "Skin",
      from: -200,
      to: 150,
      color: [242, 197, 165, 255],
      disabled: true,
    },
    {
      name: "Tendons",
      from: 85,
      to: 115,
      color: [255, 90, 152, 255],
    },
    {
      name: "Tissues",
      from: 150,
      to: 250,
      color: [180, 90, 90, 240],
    },
    {
      name: "Bone",
      from: 250,
      to: 1600,
      color: [254, 252, 231, 200],
    },
    {
      name: "Metal",
      from: 1600,
      to: 3000,
      color: [160, 0, 255, 255],
    },
  ],
};

const getInitialState = () => {
  let fragment = getFragment();
  if (fragment === "") {
    fragment = "lighting";
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
  const debouncedShader = useDebounce(shader, 500);

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
            <a className="link" target="_blank" rel="noreferrer" href="https://docs.set.health/docs/guides/custom-shaders">
              <SetIcon name="document"></SetIcon>
              Docs
            </a>
          </nav>
        </header>
      {workspace && (
        <>
          <div className="panel">
            <ResizePanel direction="e" style={{
              width: '50%',
            }} >
              <ControlledEditor
                width="100%"
                height="100%"
                language="cpp"
                options={{
                  'scrollBeyondLastLine': false,
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
            </ResizePanel>
            <SetViewVolumetric
              className="volumetric"
              ambientLight={ambientLight}
              diffuseLight={directLight}
              specularLight={specularLight}
              cutLow={cutLow}
              cutHigh={cutHigh}
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
                onSetChange={(ev) => setCutLow(ev.detail)}
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
