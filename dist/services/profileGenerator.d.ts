import { PersonalityProfile } from "./personalityAnalyzer";
export interface ProfileReport {
    text: string;
    blocks: any[];
}
export declare class ProfileGenerator {
    generateReport(profiles: PersonalityProfile[]): ProfileReport;
}
//# sourceMappingURL=profileGenerator.d.ts.map