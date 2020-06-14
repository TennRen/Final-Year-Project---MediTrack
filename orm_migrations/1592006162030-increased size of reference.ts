import {MigrationInterface, QueryRunner} from "typeorm";

export class increasedSizeOfReference1592006162030 implements MigrationInterface {
    name = 'increasedSizeOfReference1592006162030'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `prescription` DROP COLUMN `reference`");
        await queryRunner.query("ALTER TABLE `prescription` ADD `reference` varchar(140) NOT NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `prescription` DROP COLUMN `reference`");
        await queryRunner.query("ALTER TABLE `prescription` ADD `reference` varchar(100) NOT NULL");
    }

}
