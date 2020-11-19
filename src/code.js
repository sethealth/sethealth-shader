
const MAX_INTENSITY = `
void main() {
    // Compute ray
    Ray ray = computeRay();

    // Early return if we are outside the volume
    if (ray.outside) {
        gl_FragColor = vec4(0.0);
        return;
    }

    // Initialize cursor
    vec3 cursor = ray.start;
    float density = 0.0;
    float maxDensity = 0.0;

    // Walk N steps, advancing our cursor
    for (int i = 0; i < ray.steps; i++) {
        // Advance the cursor using delta
        cursor += ray.delta;

        // Read the current value
        density = readVolume(cursor);
        if (density > lowCut && density < highCut) {
            maxDensity = max(density, maxDensity);
        }
    }

    maxDensity -= lowCut;
    maxDensity /= highCut-lowCut;
    gl_FragColor = readColormap(maxDensity);
}
`;


const LIGHTING = `

void main() {
  Ray ray = computeRay();

  gl_FragDepth = 1.0;

  if (ray.outside) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float alpha = 0.0;
  float maxAlpha = 0.0;
  vec3 cursor = ray.start;
  vec3 surfacePoint = vec3(0.0);
  vec4 surfaceColor = vec4(0.0);
  vec4 pxColor = vec4(0.0);

  for (int i = 0; i < ray.steps; i++) {
    cursor += ray.delta;
    pxColor = readColor(cursor);
    if (pxColor.a > 0.0) {
      alpha = (alpha + pow(pxColor.a, 4.0)) * (1.0-surfaceColor.a) * 0.5;
      surfaceColor.rgb += pxColor.rgb * alpha;
      surfaceColor.a += alpha;

      if (alpha > maxAlpha) {
        surfacePoint = cursor;
        maxAlpha = pxColor.a;
      }
      if (surfaceColor.a > 0.99) {
        gl_FragDepth = depthAt(cursor);
        surfaceColor.a = 1.0;
        break;
      }
    }
  }
  // directional light
  float directional = 0.0;

  // specular light
  float specular = 0.0;

  if (maxAlpha > 0.01) {
    // surface normal
    vec3 normal = readNormal(surfacePoint);
    directional = clamp(dot(normal, lightVector), -0.1, 1.0);

    specular = max(dot(ray.direction.xyz, reflect(lightVector, normal)), 0.0);
    specular = specular*specular*specular;
  }
  gl_FragColor = vec4((
      ambientLight
      + directional*diffuseLight
      + specular*specularLight
    ) * surfaceColor.rgb, surfaceColor.a);
}
`

const BASIC = `
void main() {
  Ray ray = computeRay();

  gl_FragDepth = 1.0;

  if (ray.outside) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float alpha = 0.0;
  float maxAlpha = 0.0;
  vec3 cursor = ray.start;
  vec3 surfacePoint = vec3(0.0);
  vec4 surfaceColor = vec4(0.0);
  vec4 pxColor = vec4(0.0);

  for (int i = 0; i < ray.steps; i++) {
    cursor += ray.delta;
    pxColor = readColor(cursor);
    if (pxColor.a > 0.0) {
      alpha = (alpha + pow(pxColor.a, 4.0)) * (1.0-surfaceColor.a) * 0.5;
      surfaceColor.rgb += pxColor.rgb * alpha;
      surfaceColor.a += alpha;

      if (surfaceColor.a > 0.99) {
        gl_FragDepth = depthAt(cursor);
        surfaceColor.a = 1.0;
        break;
      }
    }
  }

  gl_FragColor = vec4(surfaceColor.rgb, 1.0);
}

`

export default {
    'max-intensity': MAX_INTENSITY,
    'basic': BASIC,
    'lighting': LIGHTING
};
