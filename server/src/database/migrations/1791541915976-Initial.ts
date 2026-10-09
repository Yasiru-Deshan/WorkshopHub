import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1791541915976 implements MigrationInterface {
    name = 'Initial1791541915976'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'MANAGER', 'STAFF')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "full_name" character varying NOT NULL, "password_hash" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'STAFF', "is_active" boolean NOT NULL DEFAULT true, "created_by" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."workshops_status_enum" AS ENUM('DRAFT', 'OPEN', 'CANCELLED', 'COMPLETED')`);
        await queryRunner.query(`CREATE TABLE "workshops" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "title" character varying NOT NULL, "instructor" character varying NOT NULL, "location" text NOT NULL, "description" text, "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL, "ends_at" TIMESTAMP WITH TIME ZONE NOT NULL, "capacity" integer NOT NULL, "status" "public"."workshops_status_enum" NOT NULL DEFAULT 'DRAFT', "created_by" uuid NOT NULL, "updated_by" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_2c60b9191e19b15411c27ed6b96" UNIQUE ("code"), CONSTRAINT "CHK_7f145430612da00a2ce84951c5" CHECK ("capacity" > 0), CONSTRAINT "CHK_3c62c4c446fa60f3277bdf5318" CHECK ("ends_at" > "starts_at"), CONSTRAINT "PK_6d0e82a124f5b53df91c8989848" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d5635cacdecdf872104ef3d84c" ON "workshops"  ("location") `);
        await queryRunner.query(`CREATE INDEX "IDX_0e0ddefc583106261e3552778d" ON "workshops"  ("starts_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_ad53b3b75cfeccdac139dae6f9" ON "workshops"  ("status") `);
        await queryRunner.query(`CREATE TYPE "public"."registrations_status_enum" AS ENUM('ACTIVE', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "registrations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workshop_id" uuid NOT NULL, "attendee_name" character varying NOT NULL, "attendee_email" character varying NOT NULL, "status" "public"."registrations_status_enum" NOT NULL DEFAULT 'ACTIVE', "registered_by" uuid NOT NULL, "registered_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "cancelled_by" uuid, "cancelled_at" TIMESTAMP WITH TIME ZONE, "cancel_reason" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_f5166f7b54fb5b2bef0a499b11" CHECK ("status" != 'CANCELLED' OR ("cancelled_by" IS NOT NULL AND "cancelled_at" IS NOT NULL)), CONSTRAINT "PK_6013e724d7b22929da9cd7282d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_79c3042776033abe9cc3c5e9be" ON "registrations"  ("workshop_id", "status") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_a4847c1af7bd1a26c67fe485a4" ON "registrations"  ("workshop_id", "attendee_email") WHERE "status" = 'ACTIVE'`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_f32b1cb14a9920477bcfd63df2c" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workshops" ADD CONSTRAINT "FK_075faefc9ed9d23062a3c93faf8" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workshops" ADD CONSTRAINT "FK_9594496016bd24ef2376c025238" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registrations" ADD CONSTRAINT "FK_baa074efd7d8645f5bce29953e2" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registrations" ADD CONSTRAINT "FK_e8629dc4d3a668c9d86556ea0cc" FOREIGN KEY ("registered_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registrations" ADD CONSTRAINT "FK_82f3c95abb8139f490af8d8e670" FOREIGN KEY ("cancelled_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "registrations" DROP CONSTRAINT "FK_82f3c95abb8139f490af8d8e670"`);
        await queryRunner.query(`ALTER TABLE "registrations" DROP CONSTRAINT "FK_e8629dc4d3a668c9d86556ea0cc"`);
        await queryRunner.query(`ALTER TABLE "registrations" DROP CONSTRAINT "FK_baa074efd7d8645f5bce29953e2"`);
        await queryRunner.query(`ALTER TABLE "workshops" DROP CONSTRAINT "FK_9594496016bd24ef2376c025238"`);
        await queryRunner.query(`ALTER TABLE "workshops" DROP CONSTRAINT "FK_075faefc9ed9d23062a3c93faf8"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_f32b1cb14a9920477bcfd63df2c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a4847c1af7bd1a26c67fe485a4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_79c3042776033abe9cc3c5e9be"`);
        await queryRunner.query(`DROP TABLE "registrations"`);
        await queryRunner.query(`DROP TYPE "public"."registrations_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ad53b3b75cfeccdac139dae6f9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0e0ddefc583106261e3552778d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d5635cacdecdf872104ef3d84c"`);
        await queryRunner.query(`DROP TABLE "workshops"`);
        await queryRunner.query(`DROP TYPE "public"."workshops_status_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
