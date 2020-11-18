
export const CODE = `
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

/**
    struct Ray {
        vec3 start;     // start point of the ray caster
        vec3 end;       // end point of the ray caster
        vec3 delta;     // delta vector of each iteration
        vec3 direction; // normalized direction of the eye ray
        int steps;      // number of steps of our ray caster
        bool outside;   // "true" when the ray is outside the volume
    };

    Ray computeRay()
    Creates a Ray struct, containing all the ray properties required to perform a ray casting.

    float readVolume(vec3 cursor)
    Returns the normalized pixel value (density) of our volume at the specified 3D point.

    vec3 readNormal(vec3 cursor)
    Returns the normalized normal vector at the specified 3D point.
    Normals are computed as the gradient of the volume

    vec4 readColormap(float density)
    Resolves the color vector for the specified density value in thee [0, 1].

    vec4 readColor(vec3 cursor)
    Resolves the color vector based on the density at the specified 3D point.

    float depthAt(vec3 cursor)
    Returns the non-linear depth at the specified 3D point.
    This value can be passed directly to gl_FragDepth.
*/

`;
