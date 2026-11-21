import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  View,
} from 'react-native';

/**
 * Ensures inputs, buttons, and content are NEVER obscured by the on-screen keyboard.
 * Uses flexible scrolling with keyboard offset handling for both Android and iOS.
 */
export default function KeyboardAwareContainer({
  children,
  contentContainerStyle,
  style,
  keyboardVerticalOffset = Platform.OS === 'ios' ? 40 : 0,
  enableDismissOnTouch = true,
}) {
  const content = (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {children}
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {enableDismissOnTouch ? (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.inner}>{content}</View>
        </TouchableWithoutFeedback>
      ) : (
        content
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  inner: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
