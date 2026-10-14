// Starter list used while the core app is built. Gets replaced by the real
// imported dataset (SSA + other sources) once categories land.

export type Gender = 'm' | 'f' | 'u';

export interface NameEntry {
  name: string;
  gender: Gender;
}

const UNISEX = `
Jordan Rowan Sawyer Emerson Avery Riley Quinn Parker Hayden Charlie Taylor Morgan Reese Peyton Cameron
Skyler Dakota Elliott Remy Sage River Phoenix Rory Blake Jamie Casey Alex Frankie Sasha Ari Kai Ren Robin
Ellis Marlowe Shiloh Arden Finley Hollis Lennon Oakley Briar Wren Collins Sutton Indigo Ainsley Tatum
`;

const BOYS = `
James John Robert Michael William David Richard Joseph Thomas Charles Christopher Daniel Matthew Anthony
Mark Donald Steven Paul Andrew Joshua Kenneth Kevin Brian George Edward Ronald Timothy Jason Jeffrey Ryan
Jacob Gary Nicholas Eric Jonathan Stephen Larry Justin Scott Brandon Benjamin Samuel Gregory Alexander
Frank Patrick Raymond Jack Dennis Jerry Tyler Aaron Adam Nathan Henry Douglas Zachary Peter Kyle Walter
Ethan Jeremy Harold Keith Christian Roger Noah Gerald Carl Terry Sean Austin Arthur Lawrence Jesse Dylan
Bryan Joe Billy Bruce Albert Gabriel Logan Alan Wayne Roy Ralph Randy Eugene Vincent Russell Elijah Louis
Philip Johnny Wilbur Ezra Otis Cornelius Silas Abner Thaddeus Ambrose Clement Horace Lyle Cyrus Elmer
Franklin Milo Atticus Emmett Harlan Ansel Ezekiel
Mateo Santiago Diego Rafael Sebastian Alejandro Matías Emiliano Adrián Leonardo Julián Marcos Cruz Dante
Enzo Marco Luca Lorenzo Augusto Rocco Cassius Julius Marcus Octavian Tiberius Gaius Lucian Valerio Nico
Nicolás Ignacio Ramón Hugo Felix Alonzo Esteban Benicio Joaquín Gonzalo José Juan Carlos Fernando Ricardo
Mauro Bautista Emilio
Dmitri Ivan Mikhail Alexei Nikolai Yuri Sergei Viktor Anton Boris Pavel Oleg Vadim Yaroslav Stanislav Lev
Vladimir Konstantin Ilya Arkady Gleb Radomir Bogdan Mirko Zoran Tomas Lukas Jakub Mateusz Stefan
Hiro Kenji Haruto Arjun Rohan Dev Omar Idris Amir Malik Tariq Yusuf Kwame Kofi Jabari Oluwaseun Tobias
Anders Lars Soren Finn Magnus Bjorn Sven Declan Cormac Fionn Ronan Eamon Callum Hamish Angus Ewan Lachlan
Wolfgang Friedrich Klaus Matteo Giovanni Cesare Dario Fabio Orion Atlas Jasper Oliver Theo Hudson Beckett
Maddox Crosby Remington Thatcher Easton Forrest Hank Lincoln Porter Wesley Cooper Holden Ford Knox Rhett
Brooks
`;

const GIRLS = `
Olivia Emma Charlotte Amelia Sophia Mia Isabella Ava Evelyn Luna Harper Sofia Camila Eleanor Elizabeth
Violet Scarlett Emily Hazel Lily Gianna Aurora Penelope Aria Nora Chloe Ellie Mila Layla Abigail Ella Isla
Eliana Nova Madison Zoe Ivy Grace Lucy Willow Emilia Naomi Elena Stella Maya Victoria Hannah Leah Addison
Lillian Natalie Paisley Delilah Ruby Josephine Audrey Claire Bella Kinsley Alice Sadie Anna Caroline Sarah
Margaret Cora Iris Genesis Athena Eloise Jade Rose Daisy Adeline Julia Clara Vivian Josie Lydia Sienna Ada
Maeve Freya Juniper Matilda Beatrice Edith Florence Mabel Agnes Mildred Opal Pearl Ruth Esther Dorothy Mary
Martha Frances Helen Louise Harriet Winifred Cordelia Theodora Philippa Rosalind Imogen Ophelia Genevieve
Valentina Lucía Ximena Valeria Mariana Gabriela Daniela Catalina Paloma Esperanza Marisol Inés Pilar Carmen
Dolores Alma Rosa Luz Adriana Renata Julieta Antonella Regina Fernanda
Giulia Francesca Chiara Alessia Bianca Serena Aurelia Livia Octavia Cecilia Vivienne Colette Margot Amélie
Céline Juliette Élodie Brigitte Odette Simone Josette Manon Camille
Anastasia Natalia Tatiana Svetlana Irina Katya Yelena Olga Ludmila Nadia Daria Vera Zoya Galina Milena Zora
Dasha Alina Polina Veronika
Siobhan Niamh Aoife Saoirse Ciara Róisín Fiona Shona Eilidh Aisling Bridget Orla Clodagh
Greta Astrid Ingrid Sigrid Freja Linnea Elsa Liesel Heidi Frieda Annika Solveig Maren Britta
Amara Zara Leila Yara Aaliyah Aisha Fatima Noor Sakura Hana Yuki Mei Priya Ananya Anika Kiara Imani Nia
Zuri Adaeze Chiamaka Esi Thandiwe
Brooklyn Aubrey Savannah Everly Kennedy Hadley Blakely Kaylee Brielle Sloane Hallie Poppy Ember
`;

const split = (s: string) => s.trim().split(/\s+/);

function build(): NameEntry[] {
  const seen = new Set<string>();
  const out: NameEntry[] = [];
  // Unisex first so a name listed in both a gendered list and here stays unisex.
  for (const [list, gender] of [[UNISEX, 'u'], [BOYS, 'm'], [GIRLS, 'f']] as const) {
    for (const name of split(list)) {
      if (seen.has(name)) continue;
      seen.add(name);
      out.push({ name, gender });
    }
  }
  return out;
}

export const NAMES: NameEntry[] = build();
export const GENDER_OF: Record<string, Gender> = Object.fromEntries(NAMES.map((n) => [n.name, n.gender]));
