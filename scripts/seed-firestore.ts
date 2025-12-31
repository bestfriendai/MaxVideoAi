import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Use service account if available, otherwise assume we have default credentials
if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} else {
    admin.initializeApp();
}

const db = admin.firestore();

async function seedEngines() {
    console.log('Seeding engines...');
    const enginesPath = path.join(__dirname, '../fixtures/engines.json');
    const enginesData = JSON.parse(fs.readFileSync(enginesPath, 'utf8'));

    const batch = db.batch();
    enginesData.engines.forEach((engine: any) => {
        const docRef = db.collection('engines').doc(engine.id);
        batch.set(docRef, {
            ...engine,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    });

    await batch.commit();
    console.log(`Successfully seeded ${enginesData.engines.length} engines.`);
}

async function seedJobs() {
    console.log('Seeding jobs...');
    const jobsPath = path.join(__dirname, '../fixtures/jobs.json');
    const jobsData = JSON.parse(fs.readFileSync(jobsPath, 'utf8'));

    const batch = db.batch();
    jobsData.jobs.forEach((job: any) => {
        const docRef = db.collection('jobs').doc(job.jobId);
        batch.set(docRef, {
            ...job,
            createdAt: job.createdAt ? admin.firestore.Timestamp.fromDate(new Date(job.createdAt)) : admin.firestore.FieldValue.serverTimestamp()
        });
    });

    await batch.commit();
    console.log(`Successfully seeded ${jobsData.jobs.length} jobs.`);
}

async function main() {
    try {
        await seedEngines();
        await seedJobs();
        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

main();
