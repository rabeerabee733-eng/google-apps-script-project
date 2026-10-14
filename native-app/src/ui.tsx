import React from 'react';
import { ActivityIndicator, I18nManager, Pressable, StyleSheet, Text, TextInput, View, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
export const colors = { ink: '#191C20', gold: '#B18B43', pale: '#F6F4EF', muted: '#74766F', line: '#E5E1D7', green: '#26785C' };
export function Label({ children, muted = false, big = false }: { children: React.ReactNode; muted?: boolean; big?: boolean }) { return <Text style={[s.text, muted && s.muted, big && s.big]}>{children}</Text>; }
export function Card({ children }: { children: React.ReactNode }) { return <View style={s.card}>{children}</View>; }
export function Button({ title, onPress, busy = false, secondary = false, disabled = false, icon }: { title: string; onPress: () => void; busy?: boolean; secondary?: boolean; disabled?: boolean; icon?: keyof typeof Ionicons.glyphMap }) { return <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled || busy} onPress={onPress} style={({ pressed }) => [s.button, secondary && s.secondary, (disabled || busy || pressed) && { opacity: .55 }]}>{busy ? <ActivityIndicator color={secondary ? colors.ink : '#fff'} /> : <><Text style={[s.buttonText, secondary && { color: colors.ink }]}>{title}</Text>{icon && <Ionicons name={icon} size={20} color={secondary ? colors.ink : '#fff'} />}</>}</Pressable>; }
export function Input({ label, ...props }: TextInputProps & { label?: string }) { return <View style={{ gap: 6 }}>{label && <Label muted>{label}</Label>}<TextInput placeholderTextColor="#999B96" {...props} style={[s.input, props.style]} /></View>; }
export function Chips({ values, selected, onChange }: { values: string[]; selected: string; onChange: (v: string) => void }) { return <View style={s.wrap}>{values.map(v => <Pressable key={v} accessibilityRole="button" accessibilityState={{ selected: v === selected }} onPress={() => onChange(v)} style={[s.chip, v === selected && s.selected]}><Text style={[s.text, v === selected && { color: '#fff' }]}>{v}</Text></Pressable>)}</View>; }
export const s = StyleSheet.create({
  text: { color: colors.ink, fontSize: 15, lineHeight: 24, textAlign: 'right', writingDirection: 'rtl' }, muted: { color: colors.muted, fontSize: 13 }, big: { fontSize: 23, fontWeight: '700', lineHeight: 34 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: colors.line, gap: 12 },
  button: { minHeight: 48, borderRadius: 12, padding: 12, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  secondary: { backgroundColor: '#EDE8DC' }, buttonText: { color: '#fff', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  input: { minHeight: 48, backgroundColor: '#fff', borderColor: colors.line, borderWidth: 1, borderRadius: 12, padding: 13, color: colors.ink, textAlign: 'right', fontSize: 16 },
  wrap: { flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse', flexWrap: 'wrap', gap: 8 }, chip: { paddingVertical: 7, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.line, borderRadius: 10, backgroundColor: '#fff' }, selected: { backgroundColor: colors.ink, borderColor: colors.ink },
  row: { flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, page: { padding: 20, gap: 16, paddingBottom: 36 },
});
