-- AlterTable
ALTER TABLE "EnvVariable" ADD COLUMN     "comment" TEXT;

-- AddForeignKey
ALTER TABLE "EnvVariable" ADD CONSTRAINT "EnvVariable_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvVariable" ADD CONSTRAINT "EnvVariable_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
