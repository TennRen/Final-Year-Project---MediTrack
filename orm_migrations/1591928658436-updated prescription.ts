import {MigrationInterface, QueryRunner} from "typeorm";

export class updatedPrescription1591928658436 implements MigrationInterface {
    name = 'updatedPrescription1591928658436'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `prescription` CHANGE `days` `days` varchar(255) NOT NULL DEFAULT ''");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `prescription` CHANGE `days` `days` varchar(255) NOT NULL");
    }

}
