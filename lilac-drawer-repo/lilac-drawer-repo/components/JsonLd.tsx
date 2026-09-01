export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  // Escaping "<" prevents a "</script>" sequence inside any string value
  // (e.g. user-generated community post/comment text) from prematurely
  // closing this script tag — the HTML parser looks for that sequence
  // literally, regardless of JS/JSON string context, so JSON.stringify
  // alone isn't safe here. \u003c renders identically once parsed as JSON.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
