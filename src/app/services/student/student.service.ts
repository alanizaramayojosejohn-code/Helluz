import { Injectable, inject } from '@angular/core';
import { Firestore, getDocs, collection, serverTimestamp } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { QueryService } from './query.service';
import { Student, StudentCreate } from '../../models/student.model';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class StudentService {

  private query = inject(QueryService)

  getall(): Observable<Student[]>{
    return this.query.getall()
  }

  getStudentById(id: string): Observable <Student | undefined> {
    return this.query.getById(id)
  }

  existStudent( ci: string, excludeId?: string): Observable <boolean> {
    return from(this.query.existByCi(ci, excludeId))
  }

  async addStudent( student: StudentCreate): Promise<string> {
    try{
      const id = uuidv7()
      const normalizedName= student.name.trim().toLowerCase()
      const ci= student.ci

      const exist= await this.query.existByCi(ci)
      if(exist){
        throw new Error('El alumno ya existe')
      }

      await this.query.create(id,
         {...student,
           name: normalizedName,
            ci: ci})

            return id
    }catch(error){
         console.error('Error al crear la sucursal', error)
         throw error
    }
  }

  // async updateStudent (id: string, student: Partial<Student>): Promise<string> {
  //   try {

  //     const normalizedName= student.name?.trim().toLowerCase()
  //     const ciStudent= student.ci?
  //     const exit = await this.query.existByCi(ciStudent, id)
  //     if(exit){
  //       throw new Error ('El del alumno ya está registrado')
  //     }

  //     await this.query.update(id, {
  //       ...student,
  //     name: normalizedName,
  //     ci: ciStudent,
  //   updatedAt: serverTimestamp,})

  //     return id

  //   } catch (error) {

  //   }

  // }


  constructor() { }

}

