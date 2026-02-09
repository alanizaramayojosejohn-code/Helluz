
export interface Day {
  id?: string;
  name: string;
  order:number;
}

export const DAYS_SEED: Omit<Day, 'id'>[]=[
  { name: 'Lunes' , order: 1},
  { name: 'Martes' , order: 2},
  { name: 'Miercoles' , order: 3},
  { name: 'Jueves' , order: 4},
  { name: 'Viernes' , order: 5},
];

export interface Discipline {
  id?: string
  name: string
  order: number
}

export const DISCIPLINE_SEED: Omit<Discipline, 'id'>[]=[
  {name: 'Boxeo', order: 1},
  {name: 'Lucha', order: 2},
  {name: 'Taekwondo', order: 3},
  {name: 'Sparring', order: 4},
  {name: 'BJJ', order: 5},
];

