/**
 * Based on rollup-plugin-glslify: https://github.com/glslify/rollup-plugin-glslify/blob/master/index.js
 * Modifications:
 * Remove use `glslify` to compile GLSL files, cause it is not necessary for shaderlab.
 */

function compressShader(code) {
  // Based on https://github.com/vwochnik/rollup-plugin-glsl
  // Modified to remove multiline comments. See #16

  let needNewline = false;
  return code
    .replace(/\\(?:\r\n|\n\r|\n|\r)|\/\*.*?\*\/|\/\/(?:\\(?:\r\n|\n\r|\n|\r)|[^\n\r])*/gs, "")
    .split(/\n+/)
    .reduce((result, line) => {
      line = line.trim().replace(/\s{2,}|\t/, " "); // lgtm[js/incomplete-sanitization]
      if (line.charAt(0) === "#") {
        if (needNewline) {
          result.push("\n");
        }
        result.push(line, "\n");
        needNewline = false;
      } else {
        result.push(line.replace(/\s*({|}|=|\*|,|\+|\/|>|<|&|\||\[|\]|\(|\)|-|!|;)\s*/g, "$1"));
        needNewline = true;
      }
      return result;
    }, [])
    .join("")
    .replace(/\n+/g, "\n");
}

export default function glsl(userOptions = {}) {
  const options = Object.assign(
    {
      include: /\.(vs|fs|vert|frag|glsl)$/
    },
    userOptions
  );

  const filter = (id) => options.include.test(id) && !options.exclude?.test(id);

  return {
    name: "glsl",
    transform(code, id) {
      if (!filter(id)) return;

      if (typeof options.compress === "function") {
        code = options.compress(code);
      } else if (options.compress !== false) {
        code = compressShader(code);
      }

      return {
        code: `export default ${JSON.stringify(code)}; // eslint-disable-line`,
        map: { mappings: "" }
      };
    }
  };
}
