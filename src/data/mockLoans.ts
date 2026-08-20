import { LoanRequest } from '../types';
import { broadcastLoansUpdate } from '../services/realtimeSync';

export const initialMockLoans: LoanRequest[] = [
  {
    id: 'loan-1',
    equipmentId: 'VET66005',
    equipmentName: 'เครื่องตรวจอัลตราซาวด์ชนิดเคลื่อนที่ (Portable Ultrasound)',
    equipmentCode: 'VET66005',
    borrowerName: 'น.สพ.วิชาญ ชูเกียรติ',
    borrowerDept: 'โรงพยาบาลสัตว์ใหญ่',
    borrowerPhone: '0812345678',
    borrowerEmail: 'wichan.choo@kku.ac.th',
    purpose: 'ใช้สำหรับออกหน่วยสัตวแพทย์เคลื่อนที่ ตรวจสุขภาพม้าและโคของเกษตรกร',
    borrowDate: '2026-07-01',
    returnDate: '2026-07-15',
    timePeriod: 'เต็มวัน (08:30 - 16:30 น.)',
    status: 'approved',
    createdAt: '2026-06-28T09:30:00.000Z',
    approvedAt: '2026-06-29T10:00:00.000Z'
  },
  {
    id: 'loan-2',
    equipmentId: 'VET64001',
    equipmentName: 'กล้องจุลทรรศน์ชนิด 3 ตาพร้อมชุดถ่ายภาพรายละเอียดสูง 2 ล้านพิกเซล',
    equipmentCode: 'VET64001',
    borrowerName: 'ดร.สมศรี รักเรียน',
    borrowerDept: 'กลุ่มวิชาพยาธิชีววิทยา',
    borrowerPhone: '0898765432',
    borrowerEmail: 'somsri.edu@kku.ac.th',
    purpose: 'ใช้งานทำวิจัยโครงสร้างเซลล์มะเร็งผิวหนังสุนัขร่วมกับสถาบันวิจัยพยาธิวิทยา',
    borrowDate: '2026-06-10',
    returnDate: '2026-06-25',
    timePeriod: 'เต็มวัน (08:30 - 16:30 น.)',
    status: 'returned',
    createdAt: '2026-06-08T08:15:00.000Z',
    approvedAt: '2026-06-08T14:20:00.000Z',
    returnedAt: '2026-06-24T16:45:00.000Z',
    conditionAfterReturn: 'ปกติพร้อมใช้งาน',
    userRating: 5,
    userFeedback: 'ระบบจองใช้งานง่ายมาก ปฏิทินแสดงช่วงเวลาว่างชัดเจน ได้รับการอนุมัติอย่างรวดเร็วและขั้นตอนส่งคืนสะดวก',
    userRatedAt: '2026-06-24T17:00:00.000Z',
    approverRating: 5,
    approverFeedback: 'ผู้ขอระบุวัตถุประสงค์การใช้ในระบบครบถ้วน นำส่งคืนตรงเวลา และบันทึกสภาพเครื่องมือในระบบเรียบร้อย',
    approverRatedAt: '2026-06-24T17:30:00.000Z',
    rating: 5,
    ratingFeedback: 'ระบบจองใช้งานง่ายมาก ปฏิทินแสดงช่วงเวลาว่างชัดเจน ได้รับการอนุมัติอย่างรวดเร็วและขั้นตอนส่งคืนสะดวก',
    ratedAt: '2026-06-24T17:00:00.000Z'
  },
  {
    id: 'loan-3',
    equipmentId: 'VET65005',
    equipmentName: 'กล้องส่องทางเดินอาหารในม้า (Equine Endoscope)',
    equipmentCode: 'VET65005',
    borrowerName: 'ศ.ดร.สิงหา มีธรรม',
    borrowerDept: 'กลุ่มวิชาอายุรศาสตร์ปศุสัตว์',
    borrowerPhone: '0854433221',
    borrowerEmail: 'singha.meet@kku.ac.th',
    purpose: 'ใช้ส่องตรวจกระเพาะอาหารม้าไข้ในกรณีศึกษาเร่งด่วน',
    borrowDate: '2026-07-09',
    returnDate: '2026-07-12',
    timePeriod: 'ครึ่งวันบ่าย (13:00 - 16:30 น.)',
    status: 'pending',
    createdAt: '2026-07-09T18:20:00.000Z'
  },
  {
    id: 'loan-4',
    equipmentId: 'VET67006',
    equipmentName: 'ชุดเตรียมตัวอย่างและตรวจปริมาณสารพันธุกรรมในสภาวะจริง (Real-time PCR)',
    equipmentCode: 'VET67006',
    borrowerName: 'นางสาวพจนีย์ ชัยสิทธิ์',
    borrowerDept: 'ห้องปฏิบัติการชันสูตรโรคทางปศุสัตว์',
    borrowerPhone: '0834567890',
    borrowerEmail: 'potjanee.ch@kku.ac.th',
    purpose: 'ใช้ทำปฏิบัติการพิเศษ คัดกรองเชื้อไข้หวัดนกในสัตว์ปีกนำเข้า',
    borrowDate: '2026-05-12',
    returnDate: '2026-05-13',
    timePeriod: 'เต็มวัน (08:30 - 16:30 น.)',
    status: 'returned',
    createdAt: '2026-05-11T11:00:00.000Z',
    approvedAt: '2026-05-11T15:30:00.000Z',
    returnedAt: '2026-05-13T10:15:00.000Z',
    conditionAfterReturn: 'ปกติพร้อมใช้งาน',
    userRating: 5,
    userFeedback: 'ระบบแจ้งเตือนการอนุมัติรวดเร็วมาก ขั้นตอนการประสานงานกับเจ้าหน้าที่ห้องแล็บสะดวกและชัดเจน',
    userRatedAt: '2026-05-13T11:00:00.000Z',
    approverRating: 4,
    approverFeedback: 'การยื่นคำขอถูกต้องตามระเบียบ ขั้นตอนการส่งมอบในระบบเป็นไปตามกำหนด',
    approverRatedAt: '2026-05-13T11:30:00.000Z',
    rating: 5,
    ratingFeedback: 'ระบบแจ้งเตือนการอนุมัติรวดเร็วมาก ขั้นตอนการประสานงานกับเจ้าหน้าที่ห้องแล็บสะดวกและชัดเจน',
    ratedAt: '2026-05-13T11:00:00.000Z'
  },
  {
    id: 'loan-5',
    equipmentId: 'VET64001',
    equipmentName: 'กล้องจุลทรรศน์ชนิด 3 ตาพร้อมชุดถ่ายภาพรายละเอียดสูง 2 ล้านพิกเซล',
    equipmentCode: 'VET64001',
    borrowerName: 'ลักขณา ฉันทะกลาง',
    borrowerDept: 'สาขาวิชาพยาธิชีววิทยา คณะสัตวแพทยศาสตร์',
    borrowerPhone: '081-234-5678',
    borrowerEmail: 'lakkch@kku.ac.th',
    purpose: 'ใช้สำหรับการเรียนการสอนวิชาพยาธิวิทยาคลินิกและการจำแนกเซลล์สัตวแพทย์',
    borrowDate: '2026-05-02',
    returnDate: '2026-05-04',
    timePeriod: 'เต็มวัน (08:30 - 16:30 น.)',
    status: 'returned',
    createdAt: '2026-05-01T09:00:00.000Z',
    approvedAt: '2026-05-01T11:30:00.000Z',
    returnedAt: '2026-05-04T15:20:00.000Z',
    conditionAfterReturn: 'ปกติพร้อมใช้งาน',
    userRating: 5,
    userFeedback: 'ระบบค้นหาเครื่องมือและจองช่วงเวลาสะดวกรวดเร็ว การอนุมัติและการคืนเครื่องมือมีระบบตรวจสอบชัดเจน',
    userRatedAt: '2026-05-04T16:00:00.000Z',
    approverRating: 5,
    approverFeedback: 'การใช้งานเพื่อการเรียนการสอน มีการส่งคืนตามกำหนดเวลาและสภาพเครื่องมือสมบูรณ์',
    approverRatedAt: '2026-05-04T16:30:00.000Z',
    rating: 5,
    ratingFeedback: 'ระบบค้นหาเครื่องมือและจองช่วงเวลาสะดวกรวดเร็ว การอนุมัติและการคืนเครื่องมือมีระบบตรวจสอบชัดเจน',
    ratedAt: '2026-05-04T16:00:00.000Z'
  }
];

export function getStoredLoans(): LoanRequest[] {
  const stored = localStorage.getItem('vet_equipment_loans');
  if (stored) {
    try {
      const parsed: LoanRequest[] = JSON.parse(stored);
      // Merge initial ratings if user has old storage without ratings on loan-2 / loan-4 / loan-5
      let needsSave = false;
      const updated = parsed.map(l => {
        const match = initialMockLoans.find(m => m.id === l.id);
        if (match && match.status === 'returned') {
          if (!l.userRating && match.userRating) {
            needsSave = true;
            l.userRating = match.userRating;
            l.userFeedback = match.userFeedback;
            l.userRatedAt = match.userRatedAt;
          }
          if (!l.approverRating && match.approverRating) {
            needsSave = true;
            l.approverRating = match.approverRating;
            l.approverFeedback = match.approverFeedback;
            l.approverRatedAt = match.approverRatedAt;
          }
          if (!l.rating && match.rating) {
            needsSave = true;
            l.rating = match.rating;
            l.ratingFeedback = match.ratingFeedback;
            l.ratedAt = match.ratedAt;
          }
        }
        return l;
      });

      // If loan-5 is missing in stored, let's include it
      if (!updated.some(l => l.id === 'loan-5')) {
        const loan5 = initialMockLoans.find(m => m.id === 'loan-5');
        if (loan5) {
          updated.push(loan5);
          needsSave = true;
        }
      }

      if (needsSave) {
        localStorage.setItem('vet_equipment_loans', JSON.stringify(updated));
      }
      return updated;
    } catch (e) {
      console.error('Error parsing stored loans', e);
    }
  }
  localStorage.setItem('vet_equipment_loans', JSON.stringify(initialMockLoans));
  return initialMockLoans;
}

export function saveLoans(loans: LoanRequest[]): void {
  localStorage.setItem('vet_equipment_loans', JSON.stringify(loans));
  broadcastLoansUpdate(loans);
}
