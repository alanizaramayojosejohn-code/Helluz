import {
   Firestore,
   collection,
   where,
   query,
   orderBy,
   CollectionReference,
   collectionData,
   getDocs,
} from '@angular/fire/firestore'
import { inject, Injectable } from '@angular/core'
import { from, Observable, catchError, throwError, map } from 'rxjs'
import { Branch, BranchCreate, BranchStatus } from '../../models/branch.model'
import { QueryService } from './query.service'
import { v7 as uuidv7 } from 'uuid'

@Injectable()
export class BranchService {
   private query = inject(QueryService)

   private readonly firestore = inject(Firestore)
   private readonly branchesCollection = collection(this.firestore, 'branches')

   getBranches(): Observable<Branch[]> {
      return this.query.getAll()
   }

   getBranchById(id: string): Observable<Branch | undefined> {
      return this.query.getById(id)
   }

   checkNameExist$(name: string, excludeId?: string): Observable<boolean> {
      return from(this.query.existByName(name, excludeId))
   }

   async addBranch(branch: BranchCreate): Promise<string> {
      try {
         const id = uuidv7()
         const normalizedName = branch.name.trim().toLowerCase()
         const exist = await this.query.existByName(normalizedName)
         if (exist) {
            throw new Error(`El nombre "${branch.name}" ya está en uso `)
         }

         await this.query.create(id, {
            ...branch,
            name: normalizedName,
         })

         return id
      } catch (error) {
         console.error('Error al crear la sucursal', error)
         throw error
      }
   }

   async updateBranch(id: string, branch: Partial<Branch>): Promise<void> {
      try {
         let updates: Partial<Branch> = { ...branch }

         if (branch.name) {
            const normalizedName = branch.name.trim().toLowerCase()
            const exists = await this.query.existByName(normalizedName, id)
            if (exists) {
               throw new Error(`El nombre "${branch.name}" ya está en uso`)
            }
            updates.name = normalizedName
         }

         await this.query.update(id, updates)
      } catch (error) {
         console.error('Error al actualizar la sucursal', error)
         throw error
      }
   }

   async deleteBranch(id: string): Promise<void> {
      try {
         await this.query.delete(id)
      } catch (error) {
         console.error('Error al eliminar la sucursal')
         throw error
      }
   }

   // getActiveBranches(): Observable<Branch[]> {
   //     const q = query(this.branchesCollection, where('status', '==', 'activo'))
   //     return collectionData(q, { idField: 'id' }) as Observable<Branch[]>
   //  }

  getActiveBranches(): Observable<Branch[]> {
    const q = query(this.branchesCollection, where('status', '==', 'activo'));
    return collectionData(q, { idField: 'id' }) as Observable<Branch[]>;
  }

}
