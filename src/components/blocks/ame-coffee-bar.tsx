import {
  CoffeePourMenu,
  type CoffeeItem,
  type CoffeeVesselMark,
} from "@/components/ui/coffee-pour-menu";

/** The AMÉ logo, printed on every cup and glass. */
export const AME_MARK: CoffeeVesselMark = {
  name: "AMÉ",
  tagline: "SPECIALTY ♡ COFFEE",
};

/** AMÉ's espresso bar, in Spanish for the Santa Cruz audience. */
export const AME_DRINKS: CoffeeItem[] = [
  {
    id: "espresso",
    name: "Espresso",
    subtitle: "30 ml · intenso",
    description: "un shot corto e intenso con crema dorada",
    vessel: "demitasse",
    layers: [{ type: "espresso", amount: 0.72 }],
    crema: true,
  },
  {
    id: "americano",
    name: "Americano",
    subtitle: "240 ml · suave",
    description: "espresso sobre agua caliente",
    vessel: "glass-mug",
    layers: [
      { type: "water", amount: 0.54 },
      { type: "espresso", amount: 0.24 },
    ],
    crema: true,
    blend: 0.9,
  },
  {
    id: "cappuccino",
    name: "Cappuccino",
    subtitle: "180 ml · aterciopelado",
    description: "espresso con leche vaporizada, espuma y arte latte",
    vessel: "cup",
    layers: [
      { type: "espresso", amount: 0.3 },
      { type: "milk", amount: 0.44 },
    ],
    foam: 0.14,
    art: "heart",
  },
  {
    id: "latte",
    name: "Latte",
    subtitle: "300 ml · cremoso",
    description: "espresso con abundante leche vaporizada y microespuma",
    vessel: "tall-glass",
    layers: [
      { type: "espresso", amount: 0.25 },
      { type: "milk", amount: 0.51 },
    ],
    foam: 0.11,
    blend: 0.15,
  },
];

export function AmeCoffeeBar() {
  return (
    <div className="flex w-full flex-col items-center">
      <CoffeePourMenu
        items={AME_DRINKS}
        defaultValue="cappuccino"
        mark={AME_MARK}
        menuLabel="Bebidas de la barra AMÉ"
        className="max-w-6xl"
      />
      <p className="mt-4 text-center text-xs tracking-tight text-[#7a5a42]">
        Ilustración interactiva por{" "}
        <a
          href="https://aakashmehra.com/ref/coffeepourmenu"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#3a271d] underline-offset-4 hover:underline"
        >
          aakashmehra.com
        </a>
      </p>
    </div>
  );
}
