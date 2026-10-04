import { CONF_LABELS } from "../data/constants";
import { styles } from "./styles";

// Small tag beside a quote's source when the match is uncertain. High-confidence
// quotes show nothing, so only the ones worth a second look stand out.
const TAGS = {
  medium: { label: "Check", style: styles.confTagMedium },
  low:    { label: "Low",   style: styles.confTagLow },
};

export default function ConfidenceTag({ confidence }) {
  const tag = TAGS[confidence];
  if (!tag) return null;
  return (
    <span className="ui-tip ui-tip-below" data-tip={CONF_LABELS[confidence]} style={{ ...styles.confTag, ...tag.style }}>
      {tag.label}
    </span>
  );
}
