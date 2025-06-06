async function UnzipBase64EncodedString(data) {
  const decompress = base64string => {
    const bytes = Uint8Array.from(atob(base64string), c => c.charCodeAt(0));
    const cs = new DecompressionStream('gzip');
    const writer = cs.writable.getWriter();
    writer.write(bytes);
    writer.close();
    return new Response(cs.readable).arrayBuffer().then(function (arrayBuffer) {
        return new TextDecoder().decode(arrayBuffer);
    });
  }
  return await decompress(data);
}

function getUriParam(key) {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('csv');
}

async function loadCsvFromData(data) {
  const csv = await UnzipBase64EncodedString(data);
  return csv.replaceAll('\\t', '\t').replaceAll('\t\\n\t', '\n');
}