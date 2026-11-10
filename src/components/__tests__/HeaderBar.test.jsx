// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import HeaderBar from "../HeaderBar";
import { styles } from "../styles";

function renderHeader(props = {}) {
  const setShowAddMore = vi.fn();
  render(
    <HeaderBar
      view="table" compact={false} setView={vi.fn()} setCompact={vi.fn()}
      showStats={false} setShowStats={vi.fn()}
      showAddMore={false} setShowAddMore={setShowAddMore}
      isMobile={false}
      setConfirmClear={vi.fn()}
      addMoreRef={{ current: null }}
      headerRef={{ current: null }}
      exportDropdownContent={null}
      syncStatus="idle" lastSynced={null} onManualSync={vi.fn()} onOpenSync={vi.fn()}
      dark={false} toggleTheme={vi.fn()} themeMode="auto"
      showConfidence setShowConfidence={vi.fn()}
      onShowShortcuts={vi.fn()}
      collectionTitle="All quotes" quoteCount={3} sourceCount={2}
      notice={null}
      onOpenCollections={vi.fn()}
      {...props}
    />,
  );
  return { setShowAddMore, button: screen.getByRole("button", { name: /Add quotes/ }) };
}

afterEach(cleanup);

// jsdom normalizes colors (#3C5775 → rgb(...)); run expected values through the same parser
function css(prop, value) {
  const el = document.createElement("div");
  el.style[prop] = value;
  return el.style[prop];
}

describe("HeaderBar — Add quotes button", () => {
  it("uses the solid primary style while the add panel is closed", () => {
    const { button } = renderHeader({ showAddMore: false });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(button.style.background).toBe(css("background", styles.addMoreBtn.background));
    expect(button.style.color).toBe(css("color", styles.addMoreBtn.color));
    expect(button.style.color).not.toBe(css("color", styles.addMoreBtnActive.color));
  });

  it("switches to styles.addMoreBtnActive while the add panel is open", () => {
    const { button } = renderHeader({ showAddMore: true });
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(button.style.background).toBe(css("background", styles.addMoreBtnActive.background));
    expect(button.style.color).toBe(css("color", styles.addMoreBtnActive.color));
    expect(button.style.borderColor).toBe(css("borderColor", styles.addMoreBtnActive.borderColor));
    // Guard against jsdom silently dropping var() values (which would make the above vacuous)
    expect(button.style.background).toContain("var(--cp-bg-tab)");
  });

  it("toggles the add panel on click", () => {
    const { button, setShowAddMore } = renderHeader({ showAddMore: true });
    fireEvent.click(button);
    expect(setShowAddMore).toHaveBeenCalledWith(false);
  });

  it("is not rendered in the header on mobile (a floating button replaces it)", () => {
    render(
      <HeaderBar
        view="cards" compact={false} setView={vi.fn()} setCompact={vi.fn()}
        showAddMore={false} setShowAddMore={vi.fn()} isMobile
        addMoreRef={{ current: null }} headerRef={{ current: null }}
        syncStatus="idle" showConfidence setShowConfidence={vi.fn()}
        collectionTitle="All quotes" quoteCount={1} sourceCount={1}
      />,
    );
    expect(screen.queryByRole("button", { name: /Add quotes/ })).toBeNull();
  });
});
