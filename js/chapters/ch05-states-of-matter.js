/* Chapter 5 · States of matter
   Source: coursebook pages 154–163 (sections 5.1, 5.2, 5.3).
   Inline markup used in text:  **bold**   ==key term==   *italic*   _{sub}   ^{sup}
*/
window.IMAT = window.IMAT || { chapters: [] };

window.IMAT.chapters.push({
  id: 'c5',
  number: 5,
  title: `States of matter`,
  pages: `pp. 154–163`,
  blurb: `Particle model, kinetic theory, ideal gases, pV = nRT, finding M_{r}, vapour pressure.`,

  topics: {
    states: `States & structure`,
    kinetic: `Kinetic theory`,
    ideal: `Ideal vs real gases`,
    laws: `Gas laws`,
    equation: `pV = nRT`,
    mr: `Finding M_{r}`,
    liquids: `Liquids & vapour pressure`
  },

  /* ------------------------------------------------------------------ */
  sections: [
    {
      id: '5.1',
      title: `States of matter`,
      blocks: [
        { t: 'p', x: `The state of a substance is decided by three things about its particles: **how close** they are, **how they are arranged** and **how they move**.` },
        { t: 'table', head: ['', 'Gas', 'Liquid', 'Solid'], rows: [
          ['Shape', 'No fixed shape', 'Takes the shape of its container', 'Fixed shape'],
          ['Volume', 'No fixed volume', 'Fixed volume', 'Fixed volume'],
          ['Spacing', 'Far apart', 'Close together', 'Touching'],
          ['Compression', 'Easily compressed', 'Only slightly', 'Cannot be compressed'],
          ['Arrangement', 'Random', 'Mostly random', 'Usually regular'],
          ['Movement', 'Move freely, all directions', 'Limited movement, slide past each other', 'Vibrate only, cannot change places']
        ] },
        { t: 'fig', id: 'states', x: `See the particle model move` },
        { t: 'h', x: `Structure decides the state at r.t.p.` },
        { t: 'p', x: `The state at ==room temperature and pressure (r.t.p.)== depends on **structure and bonding**. Four types of structure are found in elements and compounds:` },
        { t: 'table', head: ['Structure', 'Examples', 'What holds it together'], rows: [
          ['Simple molecular / simple atomic', 'CO_{2}, Ar', 'Weak intermolecular forces between molecules or atoms'],
          ['Giant ionic', 'NaCl', 'Strong electrostatic attraction between oppositely charged ions'],
          ['Giant metallic', 'Fe, Cu', 'Metallic bonding: cations in a sea of delocalised electrons'],
          ['Giant molecular', 'SiO_{2} (silicon(IV) oxide)', 'A network of strong covalent bonds']
        ] },
        { t: 'imp', x: `Noble gases exist as **isolated atoms** (simple atomic), but they have physical properties similar to simple molecular gases, so we treat them as having a simple molecular structure.` },
        { t: 'tip', x: `IMAT questions often give one property (fixed volume, compressible) and ask which particle description explains it. Always answer with **spacing + movement**.` }
      ]
    },
    {
      id: '5.2',
      title: `The gaseous state`,
      blocks: [
        { t: 'h', x: `The kinetic theory of gases` },
        { t: 'p', x: `The idea that gas molecules are in constant movement is the ==kinetic theory of gases==. It assumes that:` },
        { t: 'list', items: [
          `gas molecules move **rapidly and randomly**`,
          `the distance between molecules is much greater than their diameter, so the **volume of the molecules is negligible**`,
          `there are **no intermolecular forces** of attraction or repulsion`,
          `all collisions are **elastic**: no kinetic energy is lost`,
          `the **temperature** of the gas is related to the **average kinetic energy** of the molecules`
        ] },
        { t: 'p', x: `A theoretical gas that fits this description is an ==ideal gas==. Gases that really exist are ==real gases==; they do not fit exactly, but they can come very close.` },
        { t: 'imp', x: `Ideal gases have **zero particle volume** and **no intermolecular forces of attraction**.` },
        { t: 'p', x: `Noble gases with small atoms, such as **helium and neon**, come close to ideal behaviour because their intermolecular forces are very small.` },
        { t: 'imp', x: `The **pressure** of a gas is caused by gas molecules **colliding with the walls** of the container.` },

        { t: 'h', x: `Pressure, temperature and units` },
        { t: 'list', items: [
          `Pressure is measured in **pascals, Pa**. 1 kPa = 1000 Pa. 1 atm = 101 325 Pa.`,
          `Gas temperatures are measured in **kelvin, K**: T(K) = θ(°C) + 273. Example: 100 °C = 373 K.`,
          `Volume in m^{3}: 1 m^{3} = 1000 dm^{3} = 10^{6} cm^{3}.`
        ] },

        { t: 'h', x: `Volume and pressure (Boyle)` },
        { t: 'p', x: `At **constant temperature**, decreasing the volume squashes the molecules closer together, so they hit the walls **more often** and the pressure rises. Volume is ==inversely proportional== to pressure: a graph of V against 1/p is a straight line through the origin.` },
        { t: 'formula', x: `pV = constant      p_{1}V_{1} = p_{2}V_{2}`, note: `fixed mass of gas, constant T` },
        { t: 'fig', id: 'boyle', x: `Try the piston` },

        { t: 'h', x: `Volume and temperature (Charles)` },
        { t: 'p', x: `At **constant pressure**, heating a gas makes the molecules move faster and hit the walls **harder**. For the pressure to stay the same the molecules must spread further apart, so the volume increases. Volume is ==proportional== to the kelvin temperature.` },
        { t: 'formula', x: `V / T = constant      V_{1}/T_{1} = V_{2}/T_{2}`, note: `fixed mass of gas, constant p, T in kelvin` },
        { t: 'table', head: ['Temperature / K', '136.5', '273', '546'], rows: [['Gas volume / dm^{3}', '11.2', '22.4', '44.8']], caption: `Table 5.1: double the kelvin temperature, double the volume.` },
        { t: 'fig', id: 'charles', x: `Heat the gas` },
        { t: 'p', x: `An ideal gas has a volume that varies **exactly in proportion to its temperature** and **exactly in inverse proportion to its pressure**.` },

        { t: 'h', x: `Limitations of the ideal gas laws` },
        { t: 'p', x: `Real gases do not always obey the kinetic theory, for two reasons:` },
        { t: 'list', items: [
          `there **is** some attraction between the molecules`,
          `we **cannot ignore** the volume of the molecules themselves`
        ] },
        { t: 'imp', x: `Real gases differ most from ideal behaviour at **very high pressure** and **very low temperature**.` },
        { t: 'p', x: `Under these conditions:` },
        { t: 'list', items: [
          `the molecules are close to each other`,
          `the volume of the molecules is **not negligible** compared with the volume of the container`,
          `there are instantaneous dipole–induced dipole or permanent dipole–permanent dipole forces between the molecules`,
          `attractive forces pull molecules towards each other and **away from the walls**, so the pressure is **lower** than expected for an ideal gas`,
          `the effective volume of the gas is smaller than expected for an ideal gas`
        ] },

        { t: 'h', x: `The ideal gas equation` },
        { t: 'formula', x: `pV = nRT`, note: `the general gas equation` },
        { t: 'table', head: ['Symbol', 'Quantity', 'SI unit'], rows: [
          ['p', 'pressure', 'Pa'],
          ['V', 'volume', 'm^{3} (1 m^{3} = 1000 dm^{3})'],
          ['n', 'amount of gas, n = m / M_{r}', 'mol'],
          ['R', 'gas constant = 8.31', 'J K^{-1} mol^{-1}'],
          ['T', 'temperature', 'K']
        ] },
        { t: 'p', x: `If you know any four of the five quantities you can calculate the fifth. Be ready to rearrange: V = nRT/p,  p = nRT/V,  n = pV/RT,  T = pV/nR.` },
        { t: 'imp', x: `Shortcut: put p in **kPa** and you get V in **dm^{3}**. Put p in **Pa** and you get V in **m^{3}**. The ×1000 and ÷1000 cancel because p and V are on the same side of the equation.` },
        { t: 'worked', title: `Worked example 1 · volume of 0.500 mol CO_{2} at 150 kPa and 19 °C`, steps: [
          `p = 150 kPa = 150 000 Pa;  T = 19 + 273 = 292 K`,
          `V = nRT / p = (0.500 × 8.31 × 292) / 150 000`,
          `V = 8.09 × 10^{-3} m^{3} = **8.09 dm^{3}**`
        ] },
        { t: 'worked', title: `Worked example 2 · pressure of 4.00 g O_{2} in 5.00 dm^{3} at 127 °C`, steps: [
          `T = 127 + 273 = 400 K;  V = 5.00 × 10^{-3} m^{3};  n = 4.00 / 32.0 = 0.125 mol`,
          `p = nRT / V = (0.125 × 8.31 × 400) / (5.00 × 10^{-3})`,
          `p = **8.31 × 10^{4} Pa**`
        ] },

        { t: 'h', x: `Calculating relative molecular mass` },
        { t: 'p', x: `A mass spectrometer gives M_{r} accurately. A school method uses the gas equation: since n = m / M_{r},` },
        { t: 'formula', x: `pV = (m / M_{r}) RT    ⇒    M_{r} = mRT / pV`, note: `m in g gives M_{r} in g mol^{-1}` },
        { t: 'worked', title: `Worked example 3 · 5.28 g of gas in 2.00 dm^{3} at 200 kPa and 20 °C`, steps: [
          `p = 2.00 × 10^{5} Pa;  T = 293 K;  V = 2.00 × 10^{-3} m^{3}`,
          `M_{r} = (5.28 × 8.31 × 293) / (2.00 × 10^{5} × 2.00 × 10^{-3})`,
          `M_{r} = 32.14 ≈ **32 g mol^{-1}**`
        ] },
        { t: 'p', x: `For a **volatile liquid**, inject a weighed sample into a gas syringe inside a ==syringe oven==. It vaporises and you read the volume of vapour.` },
        { t: 'list', items: [
          `volume of vapour = final gas syringe volume − initial gas syringe volume`,
          `mass of liquid = initial mass of hypodermic syringe + liquid − final mass of hypodermic syringe + liquid`,
          `use the **oven temperature** in kelvin and the atmospheric pressure in Pa`
        ] },
        { t: 'fig', id: 'syringe', x: `See the syringe oven` },
        { t: 'tip', x: `Error questions: if not all the liquid vaporises, the measured V is too small, so M_{r} = mRT/pV comes out **too high**. Weighing gases is hard because they are so light and air gives buoyancy.` }
      ]
    },
    {
      id: '5.3',
      title: `The liquid state`,
      blocks: [
        { t: 'h', x: `Melting and freezing` },
        { t: 'p', x: `When we heat a solid:` },
        { t: 'list', items: [
          `the energy makes the particles **vibrate more vigorously**`,
          `the forces of attraction between the particles weaken`,
          `the solid changes to a liquid at its **melting point** (melting)`
        ] },
        { t: 'imp', x: `The ==melting point== of a solid is the temperature at which it changes to a liquid at **1 atmosphere** pressure.` },
        { t: 'p', x: `**Ionic** compounds need a high temperature to melt because ionic bonding is very strong. **Molecular** solids melt at lower temperatures: only the weak intermolecular forces must be overcome.` },
        { t: 'p', x: `Particles in a liquid are still close together but have enough kinetic energy to keep **sliding past each other** in a fairly random way. For brief periods they are slightly ordered, but this order keeps breaking up as they gain kinetic energy from neighbours.` },
        { t: 'p', x: `When we **cool a liquid**, the particles lose kinetic energy, feel increasing forces of attraction, and stop sliding past each other when the temperature is low enough: the liquid solidifies (==freezing==).` },

        { t: 'h', x: `Vaporisation and condensation` },
        { t: 'p', x: `When we heat a liquid:` },
        { t: 'list', items: [
          `the particles move faster and the forces of attraction weaken`,
          `particles with the **most energy escape first**: the liquid **evaporates**, below the boiling point`,
          `when the forces weaken enough for all particles to become free, the liquid **boils** at its boiling point`
        ] },
        { t: 'p', x: `Liquid → gas is ==vaporisation==. The energy needed to change **one mole of liquid into one mole of gas** is the ==enthalpy change of vaporisation==.` },
        { t: 'p', x: `Cooling a vapour: particles lose kinetic energy, move more slowly, feel stronger attraction and come closer together until the gas liquefies (==condensation==).` },
        { t: 'imp', x: `Changes of state are **reversible** and involve **opposite energy transfers**: energy is transferred **to** water to boil it, and transferred **from** steam when it condenses.` },

        { t: 'h', x: `Vapour pressure` },
        { t: 'p', x: `In an **open beaker** water evaporates until none is left. In a **closed container**:` },
        { t: 'list', items: [
          `molecules escape from the surface to become vapour`,
          `as the vapour gets more crowded, slower molecules cannot overcome the attraction of their neighbours and some **return to the liquid**`,
          `eventually molecules return at the **same rate** as they escape: a position of **equilibrium** is reached and the vapour concentration stays constant`
        ] },
        { t: 'formula', x: `water molecules in liquid  ⇌  water molecules in vapour`, note: `equal rate of movement in both directions` },
        { t: 'fig', id: 'equilibrium', x: `Watch equilibrium form` },
        { t: 'p', x: `The pressure exerted by a vapour in equilibrium with its liquid is its ==vapour pressure==. It is caused by vapour particles hitting the walls. Vapour pressure **increases with temperature** because the particles have more kinetic energy and overcome intermolecular forces more easily.` },
        { t: 'imp', x: `The ==boiling point== is the temperature at which a liquid changes to a gas at 1 atm (101 325 Pa). More exactly: the temperature at which the **vapour pressure equals the atmospheric pressure**.` },
        { t: 'fig', id: 'vapour', x: `Explore the boiling point` },
        { t: 'tip', x: `Lower outside pressure (a mountain top) means the vapour pressure reaches it at a lower temperature, so water boils **below 100 °C**. A pressure cooker does the opposite.` }
      ]
    }
  ],

  /* ------------------------------------------------------------------ */
  bookQuestions: [
    { n: '1', q: `Describe the changes in the closeness and motion of the particles when (a) a solid changes to a liquid, (b) a liquid changes to a gas.`,
      a: `(a) The particles stay **close together** (only slightly further apart). They stop just vibrating in fixed positions and start **sliding past each other**, moving from place to place in a limited way.<br>(b) The particles become **far apart**. They are free of each other and **move rapidly and randomly** in all directions.` },
    { n: '2', q: `Explain why the intermolecular forces in a sample of helium and neon are very small.`,
      a: `He and Ne exist as single, small atoms with **few electrons**. The only forces are instantaneous dipole–induced dipole forces, and these are very weak for small atoms with few electrons. The atoms are non-polar, so there are no permanent dipoles.` },
    { n: '3', q: `(a) Convert into kelvin: (i) 245 °C, (ii) −45 °C. (b) How many pascals are there in 15 kPa?`,
      a: `(a)(i) 245 + 273 = **518 K**   (ii) −45 + 273 = **228 K**<br>(b) 15 × 1000 = **15 000 Pa** (1.5 × 10^{4} Pa)` },
    { n: '4', q: `Reactions with gases are done in sealed glass tubes. Use the kinetic theory to explain why thin-walled tubes should not be heated to high temperatures.`,
      a: `Heating gives the molecules more kinetic energy, so they move faster. They hit the walls **more often** and **with more force**. The volume cannot increase, so the **pressure rises** and thin walls may not withstand it and break.` },
    { n: '5', q: `(a) What is meant by an ideal gas? (b) Under what conditions do real gases differ from ideal gases? Explain.`,
      a: `(a) A theoretical gas whose molecules have **zero volume**, **no intermolecular forces**, move rapidly and randomly with **elastic collisions**; it obeys pV = nRT exactly.<br>(b) At **high pressure** the molecules are close and their own volume is no longer negligible compared with the container. At **low temperature** they move slowly, so intermolecular attractions become significant and lower the pressure.` },
    { n: '6a', q: `Calculate the volume occupied by 272 g of methane at 250 kPa and 54 °C. (R = 8.31, M_{r} = 16.0)`,
      a: `n = 272 / 16.0 = 17.0 mol;  T = 54 + 273 = 327 K<br>V = nRT / p = (17.0 × 8.31 × 327) / 250 (kPa) = **185 dm^{3}** (0.185 m^{3})` },
    { n: '6b', q: `The pressure of 0.25 mol of CO in a 10 dm^{3} flask is 120 kPa. Calculate the temperature in kelvin.`,
      a: `T = pV / nR = (120 × 10) / (0.25 × 8.31) (kPa × dm^{3}) = **578 K**` },
    { n: '7', q: `0.08 g of liquid X vaporised at 100 °C gives 23 cm^{3} of vapour at 1.02 × 10^{5} Pa. Calculate M_{r} of X.`,
      a: `T = 373 K;  V = 23 × 10^{-6} m^{3}<br>M_{r} = mRT / pV = (0.08 × 8.31 × 373) / (1.02 × 10^{5} × 23 × 10^{-6}) = **106** (≈ 110 to 2 s.f.)` },
    { n: '8', q: `A 2 × 10^{-3} m^{3} flask holds 4.19 g of gas at 300 kPa and 20 °C. Which expression gives M_{r}?`,
      a: `**A**: (4.19 × 8.31 × 293) / ((300 × 10^{3}) × (2 × 10^{-3})). T must be in K (293, not 20), p in Pa (300 × 10^{3}) because V is in m^{3}, and mRT goes on top. M_{r} ≈ 17.` },
    { n: '9', q: `Liquid bromine in a closed jar: the vapour gets darker and darker, then stops getting darker. Explain using moving particles.`,
      a: `Bromine molecules with enough kinetic energy **escape** from the liquid surface, so the concentration of vapour rises and the colour darkens. As the vapour becomes more concentrated, more molecules **collide with the surface and condense**. Eventually the rate of evaporation **equals** the rate of condensation: a **dynamic equilibrium** with constant vapour concentration, so the colour stops changing.` }
  ],

  /* ------------------------------------------------------------------ */
  flashcards: [
    { f: `Kinetic theory of gases`, b: `Molecules in a gas are in constant, rapid, random movement.` },
    { f: `Ideal gas`, b: `Zero particle volume, no intermolecular forces, elastic collisions; obeys pV = nRT exactly.` },
    { f: `Real gas: when least ideal?`, b: `High pressure and low temperature.` },
    { f: `Why are He and Ne nearly ideal?`, b: `Small atoms with few electrons, so intermolecular forces are tiny.` },
    { f: `What causes gas pressure?`, b: `Gas molecules colliding with the walls of the container.` },
    { f: `Elastic collision`, b: `A collision in which no kinetic energy is lost.` },
    { f: `°C → K`, b: `Add 273.  e.g. 25 °C = 298 K` },
    { f: `Boyle (constant T)`, b: `p_{1}V_{1} = p_{2}V_{2}. V ∝ 1/p.` },
    { f: `Charles (constant p)`, b: `V_{1}/T_{1} = V_{2}/T_{2}. V ∝ T (in kelvin).` },
    { f: `pV = nRT units`, b: `p in Pa, V in m^{3}, n in mol, R = 8.31 J K^{-1} mol^{-1}, T in K.` },
    { f: `kPa + dm^{3} shortcut`, b: `p in kPa with V in dm^{3} works directly in pV = nRT.` },
    { f: `M_{r} from gas data`, b: `M_{r} = mRT / pV` },
    { f: `Melting point`, b: `Temperature at which a solid turns to liquid at 1 atm.` },
    { f: `Enthalpy change of vaporisation`, b: `Energy needed to change 1 mol of liquid into 1 mol of gas.` },
    { f: `Vapour pressure`, b: `Pressure exerted by a vapour in equilibrium with its liquid (closed container).` },
    { f: `Boiling point (exact)`, b: `Temperature at which vapour pressure equals atmospheric pressure.` },
    { f: `Evaporation vs boiling`, b: `Evaporation: only the most energetic particles escape, below the boiling point. Boiling: all particles can become free, at the boiling point.` },
    { f: `Giant molecular example`, b: `Silicon(IV) oxide, SiO_{2}.` }
  ],

  /* ------------------------------------------------------------------ */
  cheatsheet: [
    { k: `T / K`, v: `θ / °C + 273` },
    { k: `1 kPa`, v: `10^{3} Pa` },
    { k: `1 atm`, v: `101 325 Pa` },
    { k: `1 m^{3}`, v: `10^{3} dm^{3} = 10^{6} cm^{3}` },
    { k: `Boyle`, v: `p_{1}V_{1} = p_{2}V_{2}` },
    { k: `Charles`, v: `V_{1}/T_{1} = V_{2}/T_{2}` },
    { k: `Combined`, v: `p_{1}V_{1}/T_{1} = p_{2}V_{2}/T_{2}` },
    { k: `Ideal gas`, v: `pV = nRT` },
    { k: `Moles`, v: `n = m / M_{r}` },
    { k: `Molar mass`, v: `M_{r} = mRT / pV` },
    { k: `R`, v: `8.31 J K^{-1} mol^{-1}` }
  ],

  /* ------------------------------------------------------------------ */
  figures: ['states', 'boyle', 'charles', 'syringe', 'equilibrium', 'vapour', 'calculator'],

  /* ------------------------------------------------------------------
     Question bank (IMAT style, 5 options). a = index of the correct option.
     d = difficulty 1–3. A test draws a random set from this bank.        */
  questions: [
    { id: 'c5q01', topic: 'states', d: 1,
      q: `Which statement correctly describes the particles in a liquid?`,
      o: [`They are close together and can slide past each other`, `They are far apart and move freely in all directions`, `They vibrate about fixed positions and cannot change places`, `They are in a regular arrangement and cannot be compressed`, `They are far apart in a regular arrangement`],
      a: 0, ex: `Liquid particles are close together (fixed volume, only slightly compressible) but have enough kinetic energy to slide past each other, which is why liquids take the shape of their container.` },

    { id: 'c5q02', topic: 'states', d: 1,
      q: `Which feature of the particle model best explains why gases are easily compressed?`,
      o: [`The particles move rapidly`, `The particles are far apart`, `Collisions between particles are elastic`, `The particles are randomly arranged`, `The particles have a high average kinetic energy`],
      a: 1, ex: `Compression means pushing particles closer. This is only possible if there is a lot of empty space between them: gas particles are far apart.` },

    { id: 'c5q03', topic: 'states', d: 1,
      q: `In a solid, the particles:`,
      o: [`slide past each other slowly`, `move freely but stay close together`, `vibrate about fixed positions`, `are far apart and stationary`, `are always randomly arranged`],
      a: 2, ex: `Solid particles touch each other, are usually in a regular arrangement and can only vibrate: they cannot change position.` },

    { id: 'c5q04', topic: 'states', d: 2,
      q: `Which substance has a giant molecular (covalent network) structure?`,
      o: [`Carbon dioxide`, `Sodium chloride`, `Argon`, `Silicon(IV) oxide`, `Copper`],
      a: 3, ex: `SiO_{2} is giant molecular. CO_{2} is simple molecular, Ar is simple atomic, NaCl is giant ionic and Cu is giant metallic.` },

    { id: 'c5q05', topic: 'states', d: 2,
      q: `Which pair of substances both have simple molecular or simple atomic structures?`,
      o: [`CO_{2} and Ar`, `NaCl and CO_{2}`, `Fe and Ar`, `SiO_{2} and CO_{2}`, `Cu and NaCl`],
      a: 0, ex: `Carbon dioxide is simple molecular and argon is simple atomic; both are gases at r.t.p. because only weak forces act between their particles.` },

    { id: 'c5q06', topic: 'states', d: 2,
      q: `Why does sodium chloride have a much higher melting point than a simple molecular solid?`,
      o: [`Its covalent bonds are very strong`, `It has strong intermolecular forces between NaCl molecules`, `Strong electrostatic attractions act between oppositely charged ions throughout the lattice`, `Its delocalised electrons hold the lattice together`, `Its particles are lighter`],
      a: 2, ex: `NaCl is giant ionic. Melting must overcome many strong electrostatic attractions between Na^{+} and Cl^{−} ions. There are no NaCl molecules, so B is wrong.` },

    { id: 'c5q07', topic: 'kinetic', d: 1,
      q: `Which of the following is NOT an assumption of the kinetic theory of ideal gases?`,
      o: [`Molecules move rapidly and randomly`, `The volume of the molecules is negligible`, `Collisions between molecules are elastic`, `Weak attractive forces act between molecules at short distances`, `Temperature is related to the average kinetic energy of the molecules`],
      a: 3, ex: `The kinetic theory assumes NO intermolecular forces of attraction or repulsion. Weak attractions are a feature of real gases.` },

    { id: 'c5q08', topic: 'kinetic', d: 1,
      q: `The pressure exerted by a gas in a container is caused by:`,
      o: [`the weight of the gas molecules`, `attractive forces between the molecules`, `molecules colliding with the walls of the container`, `molecules colliding with each other`, `the volume of the molecules`],
      a: 2, ex: `Pressure is force per unit area. It comes from gas molecules constantly hitting the container walls.` },

    { id: 'c5q09', topic: 'kinetic', d: 2,
      q: `A sealed rigid container of gas is heated. Why does the pressure increase?`,
      o: [`The molecules expand and take up more space`, `The number of molecules increases`, `The molecules hit the walls more often and with greater force`, `Intermolecular forces become stronger`, `The collisions become inelastic`],
      a: 2, ex: `Heating raises the average kinetic energy. Faster molecules collide with the walls more frequently and harder; the volume is fixed, so pressure rises. Molecules do not get bigger.` },

    { id: 'c5q10', topic: 'kinetic', d: 3,
      q: `Samples of helium and carbon dioxide are at the same temperature. Which statement is correct?`,
      o: [`The CO_{2} molecules have a higher average kinetic energy`, `Both gases have the same average kinetic energy`, `Both gases have the same average speed`, `The helium atoms have a higher average kinetic energy`, `The CO_{2} molecules move faster on average`],
      a: 1, ex: `Temperature is related to the average kinetic energy, so the same T means the same average KE. Since KE = ½mv^{2}, the lighter He atoms move faster on average.` },

    { id: 'c5q11', topic: 'kinetic', d: 2,
      q: `A collision between two gas molecules is described as elastic. This means that:`,
      o: [`the molecules stick together`, `no kinetic energy is lost in the collision`, `both molecules stop moving`, `the molecules change shape`, `energy is released as heat`],
      a: 1, ex: `In an elastic collision the total kinetic energy before and after is the same. No kinetic energy is lost.` },

    { id: 'c5q12', topic: 'ideal', d: 1,
      q: `Under which conditions does a real gas behave most like an ideal gas?`,
      o: [`High temperature and low pressure`, `Low temperature and high pressure`, `Low temperature and low pressure`, `High temperature and high pressure`, `At its boiling point`],
      a: 0, ex: `At low pressure the molecules are far apart, so their own volume is negligible. At high temperature they move fast, so intermolecular attractions matter little.` },

    { id: 'c5q13', topic: 'ideal', d: 2,
      q: `At room temperature, which gas shows the smallest deviation from ideal behaviour?`,
      o: [`NH_{3}`, `H_{2}O`, `HCl`, `He`, `CO_{2}`],
      a: 3, ex: `Helium has small, single atoms with few electrons, so its intermolecular forces are very weak. NH_{3}, H_{2}O and HCl are polar (H_{2}O and NH_{3} even form hydrogen bonds).` },

    { id: 'c5q14', topic: 'ideal', d: 2,
      q: `Why is the pressure of a real gas at low temperature lower than that predicted for an ideal gas?`,
      o: [`The molecules have a larger volume`, `Attractive forces pull the molecules towards each other and away from the walls`, `The molecules move faster at low temperature`, `Collisions with the walls become more frequent`, `The number of moles decreases`],
      a: 1, ex: `Intermolecular attractions pull molecules back towards each other, so they hit the walls less often and less hard than ideal molecules would.` },

    { id: 'c5q15', topic: 'ideal', d: 2,
      q: `Which factor becomes significant for a real gas at very high pressure?`,
      o: [`The volume of the molecules compared with the container`, `The speed of the molecules`, `The elastic nature of collisions`, `The mass of the container`, `The colour of the gas`],
      a: 0, ex: `At very high pressure the molecules are squeezed close together, so their own volume is no longer negligible compared with the volume of the container.` },

    { id: 'c5q16', topic: 'laws', d: 1,
      q: `A gas is at −23 °C. What is its temperature in kelvin?`,
      o: [`23 K`, `250 K`, `296 K`, `−250 K`, `273 K`],
      a: 1, ex: `T = θ + 273 = −23 + 273 = 250 K. Kelvin temperatures are never negative.` },

    { id: 'c5q17', topic: 'laws', d: 1,
      q: `A fixed mass of gas occupies 6.0 dm^{3} at 100 kPa. At constant temperature the pressure is raised to 300 kPa. What is the new volume?`,
      o: [`18 dm^{3}`, `3.0 dm^{3}`, `2.0 dm^{3}`, `0.50 dm^{3}`, `6.0 dm^{3}`],
      a: 2, ex: `Boyle: p_{1}V_{1} = p_{2}V_{2}, so V_{2} = (100 × 6.0) / 300 = 2.0 dm^{3}. Tripling the pressure divides the volume by three.` },

    { id: 'c5q18', topic: 'laws', d: 2,
      q: `300 cm^{3} of gas at 27 °C is heated at constant pressure to 127 °C. What is the new volume?`,
      o: [`1411 cm^{3}`, `225 cm^{3}`, `400 cm^{3}`, `600 cm^{3}`, `300 cm^{3}`],
      a: 2, ex: `Use kelvin: T_{1} = 300 K, T_{2} = 400 K. V_{2} = 300 × 400/300 = 400 cm^{3}. Using °C (127/27) gives the trap answer 1411 cm^{3}.` },

    { id: 'c5q19', topic: 'laws', d: 2,
      q: `For a fixed mass of ideal gas, the pressure is doubled and the kelvin temperature is doubled. The volume:`,
      o: [`doubles`, `halves`, `quadruples`, `stays the same`, `falls to a quarter`],
      a: 3, ex: `V = nRT/p. Doubling T doubles V and doubling p halves V, so the two changes cancel and V stays the same.` },

    { id: 'c5q20', topic: 'laws', d: 2,
      q: `For a fixed mass of ideal gas at constant temperature, which plot gives a straight line through the origin?`,
      o: [`V against p`, `V against 1/p`, `pV against p`, `V against p^{2}`, `p against T in °C`],
      a: 1, ex: `V ∝ 1/p at constant T, so V against 1/p is a straight line through the origin. V against p is a curve, and pV against p is a horizontal line.` },

    { id: 'c5q21', topic: 'laws', d: 3,
      q: `At constant pressure, the volume of an ideal gas is plotted against temperature in °C. The graph is:`,
      o: [`a straight line through the origin`, `a curve through the origin`, `a horizontal line`, `a straight line that meets the temperature axis at −273 °C`, `a straight line that meets the temperature axis at +273 °C`],
      a: 3, ex: `V ∝ T in kelvin. 0 K is −273 °C, so on a °C axis the straight line extrapolates to zero volume at −273 °C, not at the origin.` },

    { id: 'c5q22', topic: 'laws', d: 2,
      q: `Using the data in Table 5.1 (136.5 K → 11.2 dm^{3}), what volume would the gas occupy at 409.5 K and the same pressure?`,
      o: [`22.4 dm^{3}`, `33.6 dm^{3}`, `44.8 dm^{3}`, `16.8 dm^{3}`, `30.0 dm^{3}`],
      a: 1, ex: `409.5 K is three times 136.5 K. V ∝ T, so V = 3 × 11.2 = 33.6 dm^{3}.` },

    { id: 'c5q23', topic: 'laws', d: 1,
      q: `When a fixed amount of ideal gas is compressed at constant temperature, which quantity stays constant?`,
      o: [`p/V`, `V/T`, `pV`, `p + V`, `p`],
      a: 2, ex: `Boyle's law: at constant temperature, pV = constant for a fixed mass of gas.` },

    { id: 'c5q24', topic: 'equation', d: 1,
      q: `What is 250 cm^{3} expressed in m^{3}?`,
      o: [`2.5 × 10^{-1} m^{3}`, `2.5 × 10^{-3} m^{3}`, `2.5 × 10^{-4} m^{3}`, `2.5 × 10^{-6} m^{3}`, `2.5 × 10^{2} m^{3}`],
      a: 2, ex: `1 m^{3} = 10^{6} cm^{3}, so 250 cm^{3} = 250 × 10^{-6} = 2.5 × 10^{-4} m^{3}.` },

    { id: 'c5q25', topic: 'equation', d: 2,
      q: `What volume does 0.50 mol of an ideal gas occupy at 100 kPa and 300 K? (R = 8.31 J K^{-1} mol^{-1})`,
      o: [`1.25 dm^{3}`, `12.5 dm^{3}`, `125 dm^{3}`, `12.5 m^{3}`, `2.49 dm^{3}`],
      a: 1, ex: `V = nRT/p = (0.50 × 8.31 × 300) / 100 = 12.5 dm^{3} (p in kPa gives V in dm^{3}).` },

    { id: 'c5q26', topic: 'equation', d: 2,
      q: `How many moles of gas are in 2.49 dm^{3} at 100 kPa and 300 K? (R = 8.31 J K^{-1} mol^{-1})`,
      o: [`0.0100 mol`, `0.100 mol`, `1.00 mol`, `10.0 mol`, `0.249 mol`],
      a: 1, ex: `n = pV/RT = (100 × 2.49) / (8.31 × 300) = 249 / 2493 = 0.100 mol.` },

    { id: 'c5q27', topic: 'equation', d: 2,
      q: `Equal volumes of the following gases are at the same temperature and pressure. Which sample has the greatest mass?`,
      o: [`CH_{4}`, `Ne`, `N_{2}`, `O_{2}`, `CO_{2}`],
      a: 4, ex: `From pV = nRT, equal p, V and T means equal n. Mass = n × M_{r}, so the gas with the largest M_{r} (CO_{2}, 44) has the greatest mass.` },

    { id: 'c5q28', topic: 'equation', d: 3,
      q: `A gas at 27 °C is in a sealed rigid flask at 150 kPa. It is heated to 327 °C. What is the new pressure?`,
      o: [`300 kPa`, `75 kPa`, `1817 kPa`, `225 kPa`, `150 kPa`],
      a: 0, ex: `n and V are constant, so p ∝ T in kelvin. T goes from 300 K to 600 K (doubles), so p doubles to 300 kPa. Using °C gives the trap 1817 kPa.` },

    { id: 'c5q29', topic: 'equation', d: 3,
      q: `A student substitutes p in kPa and V in m^{3} into pV = nRT to find n. The calculated value of n will be:`,
      o: [`correct`, `1000 times too large`, `1000 times too small`, `10^{6} times too small`, `273 times too large`],
      a: 2, ex: `Using kPa makes p 1000 times smaller than in Pa while V is in the correct SI unit, so pV and hence n = pV/RT is 1000 times too small. The shortcut only works with kPa AND dm^{3} together.` },

    { id: 'c5q30', topic: 'mr', d: 2,
      q: `0.284 g of a gas occupies 100 cm^{3} at 100 kPa and 300 K. What is its relative molecular mass? (R = 8.31 J K^{-1} mol^{-1})`,
      o: [`7.1`, `35.5`, `71`, `142`, `710`],
      a: 2, ex: `M_{r} = mRT/pV = (0.284 × 8.31 × 300) / (100 × 0.100) = 708 / 10 = 71 (p in kPa, V in dm^{3}). The gas is Cl_{2}.` },

    { id: 'c5q31', topic: 'mr', d: 2,
      q: `1.60 g of a gas occupies 1.00 dm^{3} at 200 kPa and 27 °C. What is M_{r}? (R = 8.31 J K^{-1} mol^{-1})`,
      o: [`1.8`, `10`, `20`, `40`, `200`],
      a: 2, ex: `T = 300 K. M_{r} = (1.60 × 8.31 × 300) / (200 × 1.00) = 3989 / 200 ≈ 20 (neon). Using 27 instead of 300 gives the trap 1.8.` },

    { id: 'c5q32', topic: 'mr', d: 3,
      q: `In a syringe-oven experiment, some of the injected liquid does not vaporise. The calculated M_{r} will be:`,
      o: [`too high, because the measured volume is too small`, `too low, because the measured volume is too small`, `too high, because the measured mass is too small`, `too low, because the temperature is too high`, `unaffected`],
      a: 0, ex: `The mass used includes liquid that never became vapour, so V is smaller than it should be for that mass. M_{r} = mRT/pV, so a smaller V gives an M_{r} that is too high.` },

    { id: 'c5q33', topic: 'mr', d: 3,
      q: `A student finds M_{r} of a volatile liquid but uses room temperature (293 K) in the calculation instead of the oven temperature (373 K). The result will be:`,
      o: [`correct`, `too high`, `too low`, `too high by a factor of 373`, `negative`],
      a: 2, ex: `M_{r} = mRT/pV is proportional to T. Using 293 K instead of 373 K makes the answer too low (by a factor of 293/373).` },

    { id: 'c5q34', topic: 'mr', d: 2,
      q: `A 2 × 10^{-3} m^{3} flask holds 4.19 g of gas at 300 kPa and 20 °C. Which expression gives M_{r}?`,
      o: [`(4.19 × 8.31 × 293) / (300 × 10^{3} × 2 × 10^{-3})`, `(4.19 × 8.31 × 20) / (300 × 10^{3} × 2 × 10^{-3})`, `(4.19 × 8.31 × 293) / (300 × 2 × 10^{-3})`, `(300 × 10^{3} × 2 × 10^{-3}) / (4.19 × 8.31 × 293)`, `(4.19 × 300 × 10^{3}) / (8.31 × 293 × 2 × 10^{-3})`],
      a: 0, ex: `M_{r} = mRT/pV with T in K (293), p in Pa (300 × 10^{3}) to match V in m^{3}. This gives M_{r} ≈ 17.` },

    { id: 'c5q35', topic: 'liquids', d: 1,
      q: `The vapour pressure of a liquid is the pressure exerted by:`,
      o: [`the air above the liquid`, `the liquid on the base of its container`, `a vapour in equilibrium with its liquid`, `the vapour at the boiling point only`, `the atmosphere on the liquid surface`],
      a: 2, ex: `Vapour pressure is the pressure exerted by the vapour when it is in equilibrium with its liquid in a closed container.` },

    { id: 'c5q36', topic: 'liquids', d: 1,
      q: `The boiling point of a liquid is the temperature at which:`,
      o: [`the first molecules escape from the surface`, `its vapour pressure equals the atmospheric pressure`, `evaporation stops`, `its vapour pressure is zero`, `the liquid reaches 100 °C`],
      a: 1, ex: `Boiling happens when the vapour pressure equals the external (atmospheric) pressure. Water boils at 100 °C only when that pressure is 1 atm.` },

    { id: 'c5q37', topic: 'liquids', d: 2,
      q: `Water is boiled at the top of a high mountain, where atmospheric pressure is lower. Compared with sea level, the boiling point is:`,
      o: [`higher, because the vapour pressure is higher`, `lower, because the vapour pressure equals the lower atmospheric pressure at a lower temperature`, `the same, because water always boils at 100 °C`, `higher, because there is less oxygen`, `lower, because the water molecules are lighter`],
      a: 1, ex: `Vapour pressure rises with temperature. With a lower external pressure, the vapour pressure reaches it at a lower temperature, so water boils below 100 °C.` },

    { id: 'c5q38', topic: 'liquids', d: 2,
      q: `Liquid bromine is left in a closed jar. After some time the colour of the vapour stops getting darker. This is because:`,
      o: [`evaporation has stopped`, `all the bromine has evaporated`, `the rate of evaporation equals the rate of condensation`, `condensation has stopped`, `the vapour molecules have stopped moving`],
      a: 2, ex: `A dynamic equilibrium forms: molecules still evaporate and condense, but at equal rates, so the concentration (and colour) of the vapour stays constant.` },

    { id: 'c5q39', topic: 'liquids', d: 1,
      q: `What happens to the vapour pressure of a liquid in a closed container when its temperature increases?`,
      o: [`It decreases`, `It stays the same`, `It increases`, `It becomes zero`, `It first increases, then decreases`],
      a: 2, ex: `At higher temperature more particles have enough kinetic energy to overcome intermolecular forces, so more escape and the vapour pressure increases.` },

    { id: 'c5q40', topic: 'liquids', d: 2,
      q: `Which statement about evaporation is correct?`,
      o: [`It only happens at the boiling point`, `The particles with the most energy escape first`, `It needs energy to be transferred from the liquid to the surroundings`, `All particles leave the liquid at the same time`, `It cannot happen in a closed container`],
      a: 1, ex: `Evaporation happens below the boiling point. Only the particles with enough kinetic energy to overcome the attractions escape from the surface.` },

    { id: 'c5q41', topic: 'liquids', d: 1,
      q: `The enthalpy change of vaporisation is the energy required to:`,
      o: [`melt one mole of a solid`, `change one mole of liquid into one mole of gas`, `raise 1 g of liquid by 1 K`, `change one gram of gas into liquid`, `break all covalent bonds in one mole of liquid`],
      a: 1, ex: `By definition, the enthalpy change of vaporisation is the energy needed to change one mole of liquid into one mole of gas.` },

    { id: 'c5q42', topic: 'liquids', d: 1,
      q: `Which change of state requires energy to be transferred TO the substance?`,
      o: [`Steam condensing on a window`, `Water freezing`, `Water boiling`, `Molten wax solidifying`, `A vapour liquefying`],
      a: 2, ex: `Boiling needs energy to overcome the attractions between particles. Condensing, freezing and solidifying all transfer energy FROM the substance.` }
  ]
});
