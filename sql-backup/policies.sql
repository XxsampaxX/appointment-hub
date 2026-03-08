-- =============================================
-- POLICIES.SQL - Políticas RLS
-- Execute DEPOIS de functions.sql
-- =============================================

-- PROFILES
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- GLOBAL_ROLES
CREATE POLICY "Master admins can view global roles" ON public.global_roles FOR SELECT USING (auth.uid() = user_id);

-- COMPANIES
CREATE POLICY "Anyone can view companies" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Admins can insert company" ON public.companies FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Company admin or master can update company" ON public.companies FOR UPDATE USING (is_company_admin(auth.uid(), id) OR is_master_admin(auth.uid()));
CREATE POLICY "Master admin can delete companies" ON public.companies FOR DELETE USING (is_master_admin(auth.uid()));

-- COMPANY_MEMBERS
CREATE POLICY "Members can view own membership" ON public.company_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff or master can view company members" ON public.company_members FOR SELECT USING (is_company_staff(auth.uid(), company_id) OR is_master_admin(auth.uid()));
CREATE POLICY "Users can join as user role only" ON public.company_members FOR INSERT WITH CHECK (auth.uid() = user_id AND role = 'user'::app_role);
CREATE POLICY "Admins can update members" ON public.company_members FOR UPDATE USING (is_company_admin(auth.uid(), company_id));
CREATE POLICY "Admins can delete members" ON public.company_members FOR DELETE USING (is_company_admin(auth.uid(), company_id));

-- SUBSCRIPTIONS
CREATE POLICY "Company admin can view own subscription" ON public.subscriptions FOR SELECT USING (is_company_admin(auth.uid(), company_id));
CREATE POLICY "Master admin full access subscriptions" ON public.subscriptions FOR ALL USING (is_master_admin(auth.uid()));

-- SERVICES
CREATE POLICY "Anyone can view services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Staff can insert services" ON public.services FOR INSERT WITH CHECK (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Staff can update services" ON public.services FOR UPDATE USING (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Admin can delete services" ON public.services FOR DELETE USING (is_company_admin(auth.uid(), company_id));

-- PROFESSIONALS
CREATE POLICY "Anyone can view professionals" ON public.professionals FOR SELECT USING (true);
CREATE POLICY "Staff can insert professionals" ON public.professionals FOR INSERT WITH CHECK (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Staff can update professionals" ON public.professionals FOR UPDATE USING (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Admin can delete professionals" ON public.professionals FOR DELETE USING (is_company_admin(auth.uid(), company_id));

-- CLIENTS
CREATE POLICY "Staff can view clients" ON public.clients FOR SELECT USING (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Staff can insert clients" ON public.clients FOR INSERT WITH CHECK (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Staff can update clients" ON public.clients FOR UPDATE USING (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Staff can delete clients" ON public.clients FOR DELETE USING (is_company_admin(auth.uid(), company_id));

-- APPOINTMENTS
CREATE POLICY "Users can view own appointments" ON public.appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff or master can view appointments" ON public.appointments FOR SELECT USING (is_company_staff(auth.uid(), company_id) OR is_master_admin(auth.uid()));
CREATE POLICY "Authenticated can insert appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can update appointments" ON public.appointments FOR UPDATE USING (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Staff can delete appointments" ON public.appointments FOR DELETE USING (is_company_staff(auth.uid(), company_id));

-- BLOCKED_SLOTS
CREATE POLICY "Anyone can view active blocked slots" ON public.blocked_slots FOR SELECT USING (true);
CREATE POLICY "Staff can insert blocked slots" ON public.blocked_slots FOR INSERT WITH CHECK (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Staff can update blocked slots" ON public.blocked_slots FOR UPDATE USING (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Admin can delete blocked slots" ON public.blocked_slots FOR DELETE USING (is_company_admin(auth.uid(), company_id));

-- COMPANY_WHATSAPP
CREATE POLICY "Admin can view own whatsapp config" ON public.company_whatsapp FOR SELECT USING (is_company_admin(auth.uid(), company_id));
CREATE POLICY "Admin can insert whatsapp config" ON public.company_whatsapp FOR INSERT WITH CHECK (is_company_admin(auth.uid(), company_id));
CREATE POLICY "Admin can update whatsapp config" ON public.company_whatsapp FOR UPDATE USING (is_company_admin(auth.uid(), company_id));
CREATE POLICY "Admin can delete whatsapp config" ON public.company_whatsapp FOR DELETE USING (is_company_admin(auth.uid(), company_id));
CREATE POLICY "Master admin full access company_whatsapp" ON public.company_whatsapp FOR ALL USING (is_master_admin(auth.uid()));

-- WHATSAPP_AUTO_REPLIES
CREATE POLICY "Admin can view auto replies" ON public.whatsapp_auto_replies FOR SELECT USING (is_company_admin(auth.uid(), company_id));
CREATE POLICY "Admin can insert auto replies" ON public.whatsapp_auto_replies FOR INSERT WITH CHECK (is_company_admin(auth.uid(), company_id));
CREATE POLICY "Admin can update auto replies" ON public.whatsapp_auto_replies FOR UPDATE USING (is_company_admin(auth.uid(), company_id));
CREATE POLICY "Master admin full access auto replies" ON public.whatsapp_auto_replies FOR ALL USING (is_master_admin(auth.uid()));

-- CONVERSATIONS
CREATE POLICY "Staff can view conversations" ON public.conversations FOR SELECT USING (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Staff can insert conversations" ON public.conversations FOR INSERT WITH CHECK (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Staff can update conversations" ON public.conversations FOR UPDATE USING (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Master admin full access conversations" ON public.conversations FOR ALL USING (is_master_admin(auth.uid()));

-- MESSAGES
CREATE POLICY "Staff can view messages" ON public.messages FOR SELECT USING (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Staff can insert messages" ON public.messages FOR INSERT WITH CHECK (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Master admin full access messages" ON public.messages FOR ALL USING (is_master_admin(auth.uid()));

-- WHATSAPP_LOGS
CREATE POLICY "Staff can view own company whatsapp logs" ON public.whatsapp_logs FOR SELECT USING (is_company_staff(auth.uid(), company_id));
CREATE POLICY "Service can insert whatsapp logs" ON public.whatsapp_logs FOR INSERT WITH CHECK (true);
