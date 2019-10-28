precision highp float;
precision highp int;
#define SHADER_NAME LineBasicMaterial
#define GAMMA_FACTOR 2
#define USE_COLOR
#define NUM_CLIPPING_PLANES 0
#define UNION_CLIPPING_PLANES 0
uniform mat4 viewMatrix;
uniform vec3 cameraPosition;
#define TONE_MAPPING
#define saturate(a) clamp( a, 0.0, 1.0 )
uniform float toneMappingExposure;
uniform float toneMappingWhitePoint;
vec3 LinearToneMapping( vec3 color ) {
	return toneMappingExposure * color;
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
#define Uncharted2Helper( x ) max( ( ( x * ( 0.15 * x + 0.10 * 0.50 ) + 0.20 * 0.02 ) / ( x * ( 0.15 * x + 0.50 ) + 0.20 * 0.30 ) ) - 0.02 / 0.30, vec3( 0.0 ) )
vec3 Uncharted2ToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( Uncharted2Helper( color ) / Uncharted2Helper( vec3( toneMappingWhitePoint ) ) );
}
vec3 OptimizedCineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}

31:
32: vec3 toneMapping( vec3 color ) { return LinearToneMapping( color ); }
33:
34: vec4 LinearToLinear( in vec4 value ) {
35: 	return value;
36: }
37: vec4 GammaToLinear( in vec4 value, in float gammaFactor ) {
38: 	return vec4( pow( value.xyz, vec3( gammaFactor ) ), value.w );
39: }
40: vec4 LinearToGamma( in vec4 value, in float gammaFactor ) {
41: 	return vec4( pow( value.xyz, vec3( 1.0 / gammaFactor ) ), value.w );
42: }
43: vec4 sRGBToLinear( in vec4 value ) {
44: 	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.w );
45: }
46: vec4 LinearTosRGB( in vec4 value ) {
47: 	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.w );
48: }
49: vec4 RGBEToLinear( in vec4 value ) {
50: 	return vec4( value.rgb * exp2( value.a * 255.0 - 128.0 ), 1.0 );
51: }
52: vec4 LinearToRGBE( in vec4 value ) {
53: 	float maxComponent = max( max( value.r, value.g ), value.b );
54: 	float fExp = clamp( ceil( log2( maxComponent ) ), -128.0, 127.0 );
55: 	return vec4( value.rgb / exp2( fExp ), ( fExp + 128.0 ) / 255.0 );
56: }
57: vec4 RGBMToLinear( in vec4 value, in float maxRange ) {
58: 	return vec4( value.xyz * value.w * maxRange, 1.0 );
59: }
60: vec4 LinearToRGBM( in vec4 value, in float maxRange ) {
61: 	float maxRGB = max( value.x, max( value.g, value.b ) );
62: 	float M      = clamp( maxRGB / maxRange, 0.0, 1.0 );
63: 	M            = ceil( M * 255.0 ) / 255.0;
64: 	return vec4( value.rgb / ( M * maxRange ), M );
65: }
66: vec4 RGBDToLinear( in vec4 value, in float maxRange ) {
67: 	return vec4( value.rgb * ( ( maxRange / 255.0 ) / value.a ), 1.0 );
68: }
69: vec4 LinearToRGBD( in vec4 value, in float maxRange ) {
70: 	float maxRGB = max( value.x, max( value.g, value.b ) );
71: 	float D      = max( maxRange / maxRGB, 1.0 );
72: 	D            = min( floor( D ) / 255.0, 1.0 );
73: 	return vec4( value.rgb * ( D * ( 255.0 / maxRange ) ), D );
74: }
75: const mat3 cLogLuvM = mat3( 0.2209, 0.3390, 0.4184, 0.1138, 0.6780, 0.7319, 0.0102, 0.1130, 0.2969 );
76: vec4 LinearToLogLuv( in vec4 value )  {
77: 	vec3 Xp_Y_XYZp = value.rgb * cLogLuvM;
78: 	Xp_Y_XYZp = max(Xp_Y_XYZp, vec3(1e-6, 1e-6, 1e-6));
79: 	vec4 vResult;
80: 	vResult.xy = Xp_Y_XYZp.xy / Xp_Y_XYZp.z;
81: 	float Le = 2.0 * log2(Xp_Y_XYZp.y) + 127.0;
82: 	vResult.w = fract(Le);
83: 	vResult.z = (Le - (floor(vResult.w*255.0))/255.0)/255.0;
84: 	return vResult;
85: }
86: const mat3 cLogLuvInverseM = mat3( 6.0014, -2.7008, -1.7996, -1.3320, 3.1029, -5.7721, 0.3008, -1.0882, 5.6268 );
87: vec4 LogLuvToLinear( in vec4 value ) {
88: 	float Le = value.z * 255.0 + value.w;
89: 	vec3 Xp_Y_XYZp;
90: 	Xp_Y_XYZp.y = exp2((Le - 127.0) / 2.0);
91: 	Xp_Y_XYZp.z = Xp_Y_XYZp.y / value.y;
92: 	Xp_Y_XYZp.x = value.x * Xp_Y_XYZp.z;
93: 	vec3 vRGB = Xp_Y_XYZp.rgb * cLogLuvInverseM;
94: 	return vec4( max(vRGB, 0.0), 1.0 );
95: }
96:
97: vec4 mapTexelToLinear( vec4 value ) { return LinearToLinear( value ); }
98: vec4 envMapTexelToLinear( vec4 value ) { return LinearToLinear( value ); }
99: vec4 emissiveMapTexelToLinear( vec4 value ) { return LinearToLinear( value ); }
100: vec4 linearToOutputTexel( vec4 value ) { return LinearToLinear( value ); }
101:
102: noiseToDev
uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#define PI 3.14159265359
#define PI2 6.28318530718
#define PI_HALF 1.5707963267949
#define RECIPROCAL_PI 0.31830988618
#define RECIPROCAL_PI2 0.15915494
#define LOG2 1.442695
#define EPSILON 1e-6
#define saturate(a) clamp( a, 0.0, 1.0 )
#define whiteCompliment(a) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float average( const in vec3 color ) { return dot( color, vec3( 0.3333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract(sin(sn) * c);
}
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
struct GeometricContext {
	vec3 position;
	vec3 normal;
	vec3 viewDir;
};
141: vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
142: 	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
143: }
144: vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
145: 	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
146: }
147: vec3 projectOnPlane(in vec3 point, in vec3 pointOnPlane, in vec3 planeNormal ) {
148: 	float distance = dot( planeNormal, point - pointOnPlane );
149: 	return - distance * planeNormal + point;
150: }
151: float sideOfPlane( in vec3 point, in vec3 pointOnPlane, in vec3 planeNormal ) {
152: 	return sign( dot( point - pointOnPlane, planeNormal ) );
153: }
154: vec3 linePlaneIntersect( in vec3 pointOnLine, in vec3 lineDirection, in vec3 pointOnPlane, in vec3 planeNormal ) {
155: 	return lineDirection * ( dot( planeNormal, pointOnPlane - pointOnLine ) / dot( planeNormal, lineDirection ) ) + pointOnLine;
156: }
157: mat3 transpose( const in mat3 v ) {
158: 	mat3 tmp;
159: 	tmp[0] = vec3(v[0].x, v[1].x, v[2].x);
160: 	tmp[1] = vec3(v[0].y, v[1].y, v[2].y);
161: 	tmp[2] = vec3(v[0].z, v[1].z, v[2].z);
162: 	return tmp;
163: }
164:
165: #ifdef USE_COLOR
166: 	varying vec3 vColor;
167: #endif
168:
169: #if defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP ) || defined( USE_ALPHAMAP ) || defined( USE_EMISSIVEMAP ) || defined( USE_ROUGHNESSMAP ) || defined( USE_METALNESSMAP )
170: 	varying vec2 vUv;
171: #endif
172: #if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
173: 	varying vec2 vUv2;
174: #endif
175: #ifdef USE_MAP
176: 	uniform sampler2D map;
177: #endif
178:
179: #ifdef USE_ALPHAMAP
180: 	uniform sampler2D alphaMap;
181: #endif
182:
183: #ifdef USE_AOMAP
184: 	uniform sampler2D aoMap;
185: 	uniform float aoMapIntensity;
186: #endif
187: #ifdef USE_LIGHTMAP
188: 	uniform sampler2D lightMap;
189: 	uniform float lightMapIntensity;
190: #endif
191: #if defined( USE_ENVMAP ) || defined( PHYSICAL )
192: 	uniform float reflectivity;
193: 	uniform float envMapIntensity;
194: #endif
195: #ifdef USE_ENVMAP
196: 	#if ! defined( PHYSICAL ) && ( defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) )
197: 		varying vec3 vWorldPosition;
198: 	#endif
199: 	#ifdef ENVMAP_TYPE_CUBE
200: 		uniform samplerCube envMap;
201: 	#else
202: 		uniform sampler2D envMap;
203: 	#endif
204: 	uniform float flipEnvMap;
205: 	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( PHYSICAL )
206: 		uniform float refractionRatio;
207: 	#else
208: 		varying vec3 vReflect;
209: 	#endif
210: #endif
211:
212: #ifdef USE_FOG
213: 	uniform vec3 fogColor;
214: 	varying float fogDepth;
215: 	#ifdef FOG_EXP2
216: 		uniform float fogDensity;
217: 	#else
218: 		uniform float fogNear;
219: 		uniform float fogFar;
220: 	#endif
221: #endif
222:
223: #ifdef USE_SPECULARMAP
224: 	uniform sampler2D specularMap;
225: #endif
226: #ifdef USE_LOGDEPTHBUF
227: 	uniform float logDepthBufFC;
228: 	#ifdef USE_LOGDEPTHBUF_EXT
229: 		varying float vFragDepth;
230: 	#endif
231: #endif
232:
233: #if NUM_CLIPPING_PLANES > 0
234: 	#if ! defined( PHYSICAL ) && ! defined( PHONG )
235: 		varying vec3 vViewPosition;
236: 	#endif
237: 	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
238: #endif
239:
240: void main() {
241: #if NUM_CLIPPING_PLANES > 0
242: 	for ( int i = 0; i < UNION_CLIPPING_PLANES; ++ i ) {
243: 		vec4 plane = clippingPlanes[ i ];
244: 		if ( dot( vViewPosition, plane.xyz ) > plane.w ) discard;
245: 	}
246:
247: 	#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
248: 		bool clipped = true;
249: 		for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; ++ i ) {
250: 			vec4 plane = clippingPlanes[ i ];
251: 			clipped = ( dot( vViewPosition, plane.xyz ) > plane.w ) && clipped;
252: 		}
253: 		if ( clipped ) discard;
254:
255: 	#endif
256: #endif
257:
258: 	vec4 diffuseColor = vec4( diffuse, opacity );
259: #if defined(USE_LOGDEPTHBUF) && defined(USE_LOGDEPTHBUF_EXT)
260: 	gl_FragDepthEXT = log2(vFragDepth) * logDepthBufFC * 0.5;
261: #endif
262: #ifdef USE_MAP
263: 	vec4 texelColor = texture2D( map, vUv );
264: 	texelColor = mapTexelToLinear( texelColor );
265: 	diffuseColor *= texelColor;
266: #endif
267:
268: #ifdef USE_COLOR
269: 	diffuseColor.rgb *= vColor;
270: #endif
271: #ifdef USE_ALPHAMAP
272: 	diffuseColor.a *= texture2D( alphaMap, vUv ).g;
273: #endif
274:
275: #ifdef ALPHATEST
276: 	if ( diffuseColor.a < ALPHATEST ) discard;
277: #endif
278:
279: float specularStrength;
280: #ifdef USE_SPECULARMAP
281: 	vec4 texelSpecular = texture2D( specularMap, vUv );
282: 	specularStrength = texelSpecular.r;
283: #else
284: 	specularStrength = 1.0;
285: #endif
286: 	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
287: 	#ifdef USE_LIGHTMAP
288: 		reflectedLight.indirectDiffuse += texture2D( lightMap, vUv2 ).xyz * lightMapIntensity;
289: 	#else
290: 		reflectedLight.indirectDiffuse += vec3( 1.0 );
291: 	#endif
292: #ifdef USE_AOMAP
293: 	float ambientOcclusion = ( texture2D( aoMap, vUv2 ).r - 1.0 ) * aoMapIntensity + 1.0;
294: 	reflectedLight.indirectDiffuse *= ambientOcclusion;
295: 	#if defined( USE_ENVMAP ) && defined( PHYSICAL )
296: 		float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );
297: 		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.specularRoughness );
298: 	#endif
299: #endif
300:
301: 	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
302: 	vec3 outgoingLight = reflectedLight.indirectDiffuse;
303: #ifdef USE_ENVMAP
304: 	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG )
305: 		vec3 cameraToVertex = normalize( vWorldPosition - cameraPosition );
306: 		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
307: 		#ifdef ENVMAP_MODE_REFLECTION
308: 			vec3 reflectVec = reflect( cameraToVertex, worldNormal );
309: 		#else
310: 			vec3 reflectVec = refract( cameraToVertex, worldNormal, refractionRatio );
311: 		#endif
312: 	#else
313: 		vec3 reflectVec = vReflect;
314: 	#endif
315: 	#ifdef ENVMAP_TYPE_CUBE
316: 		vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
317: 	#elif defined( ENVMAP_TYPE_EQUIREC )
318: 		vec2 sampleUV;
319: 		reflectVec = normalize( reflectVec );
320: 		sampleUV.y = asin( clamp( reflectVec.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
321: 		sampleUV.x = atan( reflectVec.z, reflectVec.x ) * RECIPROCAL_PI2 + 0.5;
322: 		vec4 envColor = texture2D( envMap, sampleUV );
323: 	#elif defined( ENVMAP_TYPE_SPHERE )
324: 		reflectVec = normalize( reflectVec );
325: 		vec3 reflectView = normalize( ( viewMatrix * vec4( reflectVec, 0.0 ) ).xyz + vec3( 0.0, 0.0, 1.0 ) );
326: 		vec4 envColor = texture2D( envMap, reflectView.xy * 0.5 + 0.5 );
327: 	#else
328: 		vec4 envColor = vec4( 0.0 );
329: 	#endif
330: 	envColor = envMapTexelToLinear( envColor );
331: 	#ifdef ENVMAP_BLENDING_MULTIPLY
332: 		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
333: 	#elif defined( ENVMAP_BLENDING_MIX )
334: 		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
335: 	#elif defined( ENVMAP_BLENDING_ADD )
336: 		outgoingLight += envColor.xyz * specularStrength * reflectivity;
337: 	#endif
338: #endif
339:
340: 	gl_FragColor = vec4( outgoingLight, diffuseColor.a );
341: #ifdef PREMULTIPLIED_ALPHA
342: 	gl_FragColor.rgb *= gl_FragColor.a;
343: #endif
344:
345: #if defined( TONE_MAPPING )
346:   gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
347: #endif
348:
349:   gl_FragColor = linearToOutputTexel( gl_FragColor );
350:
351: #ifdef USE_FOG
352: 	#ifdef FOG_EXP2
353: 		float fogFactor = whiteCompliment( exp2( - fogDensity * fogDensity * fogDepth * fogDepth * LOG2 ) );
354: 	#else
355: 		float fogFactor = smoothstep( fogNear, fogFar, fogDepth );
356: 	#endif
357: 	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
358: #endif
359:
360: }
361:
