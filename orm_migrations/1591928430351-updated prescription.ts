import {MigrationInterface, QueryRunner} from "typeorm";

export class updatedPrescription1591928430351 implements MigrationInterface {
    name = 'updatedPrescription1591928430351'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `sessions` (`id` int NOT NULL AUTO_INCREMENT, `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `sessionKey` varchar(255) NOT NULL, `expiry` datetime NOT NULL, `invalid` tinyint NOT NULL DEFAULT 0, UNIQUE INDEX `IDX_1ae515ea2b66b030cf3f5e5ba8` (`sessionKey`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `medication` (`id` int NOT NULL AUTO_INCREMENT, `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `drugBrand` varchar(255) NULL, `drugName` varchar(255) NOT NULL, `drugID` varchar(255) NOT NULL, `drugFormat` enum ('0', '1', '2', '3', '4', '5', '6', '7') NOT NULL DEFAULT '0', PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `prescription` (`id` int NOT NULL AUTO_INCREMENT, `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `doseFrequency` varchar(255) NOT NULL DEFAULT 'a day', `days` varchar(255) NOT NULL, `reference` varchar(16) NOT NULL, `patientId` int NULL, `medicationInfoId` int NULL, UNIQUE INDEX `IDX_87b644f6aeaa8548469c43ab8c` (`reference`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `feedback` (`id` int NOT NULL AUTO_INCREMENT, `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `title` varchar(255) NOT NULL, `message` text NOT NULL, `response` text NULL, `patientId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `users` (`id` int NOT NULL AUTO_INCREMENT, `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `firstName` varchar(255) NULL, `lastName` varchar(255) NULL, `email` varchar(255) NULL, `DOB` varchar(255) NOT NULL DEFAULT '01/01/1969', `password_hash` varchar(255) NULL, `isAdmin` tinyint NOT NULL DEFAULT 0, `saltine` varchar(255) NULL, `currentSessionId` int NULL, UNIQUE INDEX `REL_aad9d010f8b7d5f1367e002487` (`currentSessionId`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `work_log` (`id` int NOT NULL AUTO_INCREMENT, `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `title` varchar(255) NULL, `message` text NOT NULL, `err-code` varchar(12) NULL, `extraInfo` text NULL, `reference` varchar(255) NOT NULL, `expiry` datetime NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `api_cache` (`id` int NOT NULL AUTO_INCREMENT, `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `apiPath` varchar(255) NOT NULL, `result` longtext NOT NULL, `expiry` datetime NOT NULL, UNIQUE INDEX `IDX_efc0e14b1b9e315fed2d5c813f` (`apiPath`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `prescription` ADD CONSTRAINT `FK_d9d1ecabc97e4de5c07a1795279` FOREIGN KEY (`patientId`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `prescription` ADD CONSTRAINT `FK_01b07ea3e7b9884eb01967f4251` FOREIGN KEY (`medicationInfoId`) REFERENCES `medication`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `feedback` ADD CONSTRAINT `FK_ae15a523f30d24d11803d90e402` FOREIGN KEY (`patientId`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `users` ADD CONSTRAINT `FK_aad9d010f8b7d5f1367e002487c` FOREIGN KEY (`currentSessionId`) REFERENCES `sessions`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `users` DROP FOREIGN KEY `FK_aad9d010f8b7d5f1367e002487c`");
        await queryRunner.query("ALTER TABLE `feedback` DROP FOREIGN KEY `FK_ae15a523f30d24d11803d90e402`");
        await queryRunner.query("ALTER TABLE `prescription` DROP FOREIGN KEY `FK_01b07ea3e7b9884eb01967f4251`");
        await queryRunner.query("ALTER TABLE `prescription` DROP FOREIGN KEY `FK_d9d1ecabc97e4de5c07a1795279`");
        await queryRunner.query("DROP INDEX `IDX_efc0e14b1b9e315fed2d5c813f` ON `api_cache`");
        await queryRunner.query("DROP TABLE `api_cache`");
        await queryRunner.query("DROP TABLE `work_log`");
        await queryRunner.query("DROP INDEX `REL_aad9d010f8b7d5f1367e002487` ON `users`");
        await queryRunner.query("DROP TABLE `users`");
        await queryRunner.query("DROP TABLE `feedback`");
        await queryRunner.query("DROP INDEX `IDX_87b644f6aeaa8548469c43ab8c` ON `prescription`");
        await queryRunner.query("DROP TABLE `prescription`");
        await queryRunner.query("DROP TABLE `medication`");
        await queryRunner.query("DROP INDEX `IDX_1ae515ea2b66b030cf3f5e5ba8` ON `sessions`");
        await queryRunner.query("DROP TABLE `sessions`");
    }

}
