/**
 * Runs synchronously before paint to set the theme attribute, preventing a
 * flash of the wrong theme. Reads a saved preference, falling back to the OS
 * setting. Rendered once at the top of <body> in the root layout.
 */
export default function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';}var d=document.documentElement;d.setAttribute('data-theme',t);d.style.colorScheme=t;}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
