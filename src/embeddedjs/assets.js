// Shared assets: pure configuration used across the watchface.
// Skin and Style instances are created at the point of use.

const fonts = {
	time: "bold 42px Bitham",
	icons: "20px IcoMoon",
};

const assets = {
	fonts,
	skins: {
		black: { fill: "black" },
	},
	styles: {
		time: { color: "white", font: fonts.time },
		icons: { color: "white", font: fonts.icons },
	},
};

export default Object.freeze(assets);
