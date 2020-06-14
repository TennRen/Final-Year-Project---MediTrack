import {MigrationInterface, QueryRunner} from "typeorm";

export class madeReferenceUnique1592006188032 implements MigrationInterface {
    name = 'madeReferenceUnique1592006188032'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `prescription` ADD UNIQUE INDEX `IDX_87b644f6aeaa8548469c43ab8c` (`reference`)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `prescription` DROP INDEX `IDX_87b644f6aeaa8548469c43ab8c`");
    }

}
