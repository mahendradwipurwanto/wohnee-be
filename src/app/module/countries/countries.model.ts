import {
    Entity,
    Column, PrimaryColumn, BeforeInsert,
} from "typeorm";

let uuidv4;
(async () => {
    const { v4 } = await import("uuid");
    uuidv4 = v4;
})();

@Entity("countries")
export class EntityCountries {
    @PrimaryColumn({type: "varchar", length: 36})
    id: string;

    @BeforeInsert()
    setId() {
        if (!this.id) this.id = uuidv4();
    }

    @Column({type: "varchar", length: 100, nullable: false})
    name: string;

    @Column({type: "varchar", length: 10, nullable: false})
    code: string;

    @Column({type: "varchar", length: 10, nullable: true})
    dial_code: string;
}