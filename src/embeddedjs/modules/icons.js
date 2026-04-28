import codepoints from "icons/codepoints";
import assets from "assets";

const iconStyle = new Style(assets.styles.icons);

// Re-export all icon codepoints as default
export default codepoints;

// Label template with iconStyle baked in.
// Usage: IconLabel($, { string: icons.sun })
export const IconLabel = Label.template($ => ({
	style: iconStyle,
}));
