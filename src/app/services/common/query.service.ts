import { inject, Injectable } from "@angular/core";
import { collectionData, Firestore , DocumentData, docData} from "@angular/fire/firestore";
import { collection, CollectionReference, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import { Observable } from "rxjs";

@Injectable()

export abstract class CommonService<T extends DocumentData>{

  private firestore= inject(Firestore)
protected collection : CollectionReference<DocumentData>;
  constructor (protected collectionName: string){
    this.collection= collection(this.firestore, collectionName)
  }

  getAll(): Observable<T[]>{
    return collectionData(this.collection, {idField: 'id'}) as Observable<T[]>
  }

  getById(id: string): Observable<T | undefined> {
    const refDoc=doc(this.firestore, this.collectionName, id);
    return docData(refDoc, {idField: 'id'}) as Observable<T | undefined>
  }

  async delete(id: string): Promise <void>{
    const ref= doc(this.firestore, this.collectionName, id);

    await deleteDoc(ref)
  }

  async existByField(fielName: string, value: any, excludeId? : string): Promise<boolean>{
    const q= query(this.collection, where(fielName, '==', value))

    const docs = await getDocs(q)

    if(excludeId){
      return docs.docs.some((doc)=> doc.id !== excludeId)
    }

    return !docs.empty;

  }

  

}
