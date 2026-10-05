import { CONF_LABELS } from "../data/constants";
import { styles } from "./styles";

// Quiet marker beside a quote's source when the match is uncertain: a colored
// dot plus a word, no filled chip. High-confidence quotes show nothing, so only
// the ones worth a second look stand out.
const TAGS = {
  medium: { label: "unverified",   color: "var(--cp-conf-medium)" },
  low:    { label: "needs review", color: "var(--cp-conf-low)" },
};

export default function ConfidenceTag({ confidence }) {
  const tag = TAGS[confidence];
  if (!tag) return null;
  return (
    <span className="ui-tip ui-tip-below" data-tip={CONF_LABELS[confidence]} style={styles.confTag}>
      <span aria-hidden="true" style={{ ...styles.confDot, background: tag.color }} />
      {tag.label}
    </span>
  );
}
