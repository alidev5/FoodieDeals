import caesarSalad from "../../assets/food/caesar-salad.png";
import cheesecakePhoto from "../../assets/food/cheesecake.png";
import chiliNoodlesPhoto from "../../assets/food/chili-noodles.png";
import dumplingsPhoto from "../../assets/food/dumplings.png";
import garlicKnots from "../../assets/food/garlic-knots.png";
import hotSourSoup from "../../assets/food/hot-sour-soup.png";
import mediterraneanPhoto from "../../assets/food/mediterranean.png";
import pitaBread from "../../assets/food/pita-bread.png";
import pizzaPhoto from "../../assets/food/pizza.png";
import ramenPhoto from "../../assets/food/ramen.png";
import scallionPancake from "../../assets/food/scallion-pancake.png";
import spaghettiPomodoro from "../../assets/food/spaghetti-pomodoro.png";
import taroTeaPhoto from "../../assets/food/taro-tea.png";

const PHOTOS_BY_FILENAME = {
  "miso-ramen.png": ramenPhoto,
  "miso-ember-hero.png": ramenPhoto,
  "crispy-pork-gyoza.png": dumplingsPhoto,
  "spicy-tantan-ramen.png": ramenPhoto,
  "yuzu-cold-soba.png": chiliNoodlesPhoto,
  "chicken-gyoza.png": dumplingsPhoto,
  "chili-sesame-noodles.png": chiliNoodlesPhoto,
  "matcha-cheesecake.png": cheesecakePhoto,

  "pork-chive-dumplings.png": dumplingsPhoto,
  "shrimp-dumplings.png": dumplingsPhoto,
  "dumpling-plate.png": dumplingsPhoto,
  "lotus-dumpling-hero.png": dumplingsPhoto,
  "scallion-pancake.png": scallionPancake,
  "hot-sour-soup.png": hotSourSoup,
  "chili-oil-wontons.png": dumplingsPhoto,
  "dan-dan-noodles.png": chiliNoodlesPhoto,

  "margherita-pizza.png": pizzaPhoto,
  "little-napoli-hero.png": pizzaPhoto,
  "garlic-knots.png": garlicKnots,
  "spaghetti-pomodoro.png": spaghettiPomodoro,
  "caesar-salad.png": caesarSalad,
  "pepperoni-pizza.png": pizzaPhoto,
  "vodka-rigatoni.png": spaghettiPomodoro,
  "tiramisu.png": cheesecakePhoto,

  "chicken-shawarma-bowl.png": mediterraneanPhoto,
  "falafel-bowl.png": mediterraneanPhoto,
  "cedar-salt-hero.png": mediterraneanPhoto,
  "hummus.png": mediterraneanPhoto,
  "pita-bread.png": pitaBread,
  "lamb-kofta-plate.png": mediterraneanPhoto,
  "fattoush-salad.png": caesarSalad,

  "taro-milk-tea.png": taroTeaPhoto,
  "matcha-latte.png": taroTeaPhoto,
  "brown-sugar-boba.png": taroTeaPhoto,
  "strawberry-matcha.png": taroTeaPhoto,
  "mango-pomelo-sago.png": taroTeaPhoto,
  "taro-cloud-hero.png": taroTeaPhoto,
};

// Expo and React Native type bundled images differently (asset id vs. ImageSource), but Metro
// resolves every one to the same numeric asset id, which both Image components accept.
export const FOOD_PHOTOS = PHOTOS_BY_FILENAME as unknown as Record<string, number>;

export function resolveFoodPhoto(filename: string | undefined): number | undefined {
  return filename ? FOOD_PHOTOS[filename] : undefined;
}
