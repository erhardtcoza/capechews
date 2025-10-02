import { layout } from "./layout.js";
export const homeHTML = () => layout("CapeChews", `
  <h1>Welcome to CapeChews</h1>
  <div class="age">You confirm you are ${typeof AGE_MIN!=="undefined"?AGE_MIN:18}+</div>
  <p>Gummies, beverages, and candies. Member benefits available.</p>
  <p><a href="/shop">Browse the shop →</a></p>
`);
