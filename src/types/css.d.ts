// Next declares `*.module.css` but not plain stylesheets, so side-effect imports
// like `import "./globals.css"` fail to resolve (TS2882).
declare module "*.css"
