import { Injectable, inject } from '@angular/core'
import {
   Firestore,
   collection,
   collectionData,
   doc,
   addDoc,
   updateDoc,
   deleteDoc,
   serverTimestamp,
} from '@angular/fire/firestore'
import { Observable } from 'rxjs'
import { Day, DAYS_SEED, Discipline, DISCIPLINE_SEED } from '../../models/seeds.model'
import { ref } from '@angular/fire/storage'
import { setDoc } from 'firebase/firestore'

@Injectable()
export class SeedService {
   private firestore = inject(Firestore)
   private daysCollection = collection(this.firestore, 'days')
   private disciplineCollection = collection(this.firestore, 'disciplines')

   getDays(): Observable<Day[]> {
      return collectionData(this.daysCollection, { idField: 'id' }) as Observable<Day[]>
   }

   async addDay(data: Day) {
      return addDoc(this.daysCollection, {
         ...data,
      })
   }

   async seedDays() {
      const promises = DAYS_SEED.map((day) => this.addDay(day))
      return Promise.all(promises)
   }

   getDiscipline(): Observable<Discipline[]> {
      return collectionData(this.disciplineCollection, { idField: 'id' }) as Observable<Discipline[]>
   }

   async addDiscipline(data: Discipline) {
      return addDoc(this.disciplineCollection, {
         ...data,
      })
   }

   async seedDiscipline() {
      const promises = DISCIPLINE_SEED.map((dis) => this.addDiscipline(dis))
      return Promise.all(promises)
   }
}
